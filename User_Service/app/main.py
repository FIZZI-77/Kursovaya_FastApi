
import uuid
from fastapi import FastAPI, HTTPException, Request, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from .common import get_db_pool, get_redis, KafkaPublisher, decode_current_user, require_roles, record_to_dict
from .schemas import CreateUserProfileRequest, UpdateProfileRequest, WorkerProfileIn, SkillIDs, SkillCreate, ChangeRoleRequest

app = FastAPI(title="User/Profile Service FastAPI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
publisher = KafkaPublisher("user.events")

@app.on_event("startup")
async def startup():
    app.state.db = await get_db_pool(); app.state.redis = await get_redis(); await publisher.start()
@app.on_event("shutdown")
async def shutdown():
    await publisher.stop(); await app.state.db.close(); await app.state.redis.aclose()
@app.get("/")
async def root(): return {"message":"User Service is running"}
@app.get("/health")
async def health(): return {"status":"ok"}

@app.get("/user/profile")
@app.get("/profile")
async def get_user_profile(user=Depends(require_roles("user","contractor","admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db:
        row=await db.fetchrow("SELECT id,email,phone,full_name,role,is_banned,created_at,updated_at FROM user_profile WHERE id=$1", user['user_id'])
    if not row: raise HTTPException(404,"profile not found")
    return record_to_dict(row)

@app.post("/user/profile")
@app.post("/profile")
async def create_user_profile(data: CreateUserProfileRequest, user=Depends(decode_current_user), request: Request=None):
    async with request.app.state.db.acquire() as db:
        row=await db.fetchrow("""INSERT INTO user_profile (id,email,phone,full_name,role,is_banned,created_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,false,NOW(),NOW()) RETURNING id,email,phone,full_name,role,is_banned,created_at,updated_at""", user['user_id'], data.email, data.phone, data.full_name, user.get('role') or 'user')
    await publisher.publish("profile_created","UserService",str(user['user_id']),{"email":data.email})
    return {"message":"profile created successfully","profile":record_to_dict(row)}

@app.put("/user/profile")
@app.put("/profile")
async def update_user_profile(data: UpdateProfileRequest, user=Depends(decode_current_user), request: Request=None):
    async with request.app.state.db.acquire() as db:
        row=await db.fetchrow("""UPDATE user_profile SET email=COALESCE($2,email), phone=COALESCE($3,phone), full_name=$4, updated_at=NOW()
        WHERE id=$1 RETURNING id,email,phone,full_name,role,is_banned,created_at,updated_at""", user['user_id'], str(data.email) if data.email else None, data.phone, data.full_name)
    if not row: raise HTTPException(404,"profile not found")
    await publisher.publish("profile_updated","UserService",str(user['user_id']),{})
    return {"message":"profile updated successfully","profile":record_to_dict(row)}

@app.get("/worker/profile")
async def get_worker_profile(user=Depends(require_roles("contractor","admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db:
        row=await db.fetchrow("SELECT user_profile_id AS user_id,specialty FROM workers WHERE user_profile_id=$1", user['user_id'])
        skills=await db.fetch("SELECT s.id,s.name FROM skills s JOIN workers_skills ws ON ws.skill_id=s.id WHERE ws.worker_id=$1", user['user_id'])
    if not row: raise HTTPException(404,"worker profile not found")
    return {**record_to_dict(row), "skills":[record_to_dict(x) for x in skills]}

@app.post("/worker/profile")
async def create_worker_profile(data: WorkerProfileIn, user=Depends(decode_current_user), request: Request=None):
    async with request.app.state.db.acquire() as db:
        async with db.transaction():
            await db.execute("UPDATE user_profile SET role='contractor' WHERE id=$1", user['user_id'])
            row=await db.fetchrow("INSERT INTO workers (user_profile_id,specialty) VALUES ($1,$2) ON CONFLICT (user_profile_id) DO UPDATE SET specialty=EXCLUDED.specialty RETURNING user_profile_id AS user_id,specialty", user['user_id'], data.specialty)
    await publisher.publish("worker_profile_created","UserService",str(user['user_id']),{})
    return {"message":"worker profile created successfully","profile":record_to_dict(row)}

@app.put("/worker/profile")
async def update_worker_profile(data: WorkerProfileIn, user=Depends(require_roles("contractor","admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db:
        row=await db.fetchrow("UPDATE workers SET specialty=$2 WHERE user_profile_id=$1 RETURNING user_profile_id AS user_id,specialty", user['user_id'], data.specialty)
    if not row: raise HTTPException(404,"worker profile not found")
    return {"message":"worker profile updated successfully","profile":record_to_dict(row)}

@app.delete("/worker/profile")
async def delete_worker_profile(user=Depends(require_roles("contractor","admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db:
        await db.execute("DELETE FROM workers_skills WHERE worker_id=$1", user['user_id']); await db.execute("DELETE FROM workers WHERE user_profile_id=$1", user['user_id']); await db.execute("UPDATE user_profile SET role='user' WHERE id=$1", user['user_id'])
    return {"message":"worker profile deleted successfully"}

@app.get("/worker/skills")
async def get_worker_skills(user=Depends(require_roles("contractor","admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db:
        rows=await db.fetch("SELECT s.id,s.name FROM skills s JOIN workers_skills ws ON ws.skill_id=s.id WHERE ws.worker_id=$1 ORDER BY s.name", user['user_id'])
    return {"skills":[record_to_dict(r) for r in rows]}
@app.post("/worker/skills")
async def add_worker_skills(data: SkillIDs, user=Depends(require_roles("contractor","admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db:
        for sid in data.skill_ids: await db.execute("INSERT INTO workers_skills(worker_id,skill_id) VALUES($1,$2) ON CONFLICT DO NOTHING", user['user_id'], sid)
    return {"message":"skills added successfully"}
@app.delete("/worker/skills")
async def remove_worker_skills(data: SkillIDs, user=Depends(require_roles("contractor","admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db:
        await db.execute("DELETE FROM workers_skills WHERE worker_id=$1 AND skill_id=ANY($2::int[])", user['user_id'], data.skill_ids)
    return {"message":"skills removed successfully"}
@app.get("/skills")
async def get_all_skills(request: Request):
    async with request.app.state.db.acquire() as db: rows=await db.fetch("SELECT id,name FROM skills ORDER BY name")
    return {"skills":[record_to_dict(r) for r in rows]}

@app.get("/admin/users")
async def get_user_list(role: str|None=None, search: str|None=None, page:int=1, limit:int=20, user=Depends(require_roles("admin","superadmin")), request: Request=None):
    where=[]; args=[]; n=1
    if role: where.append(f"role=${n}"); args.append(role); n+=1
    if search: where.append(f"(full_name ILIKE ${n} OR email ILIKE ${n})"); args.append('%'+search+'%'); n+=1
    q="SELECT id,email,phone,full_name,role,is_banned,created_at,updated_at FROM user_profile"+(" WHERE "+" AND ".join(where) if where else "")+f" ORDER BY created_at DESC LIMIT ${n} OFFSET ${n+1}"
    args += [limit, max(page-1,0)*limit]
    async with request.app.state.db.acquire() as db: rows=await db.fetch(q,*args)
    return {"users":[record_to_dict(r) for r in rows],"page":page,"limit":limit}
@app.post("/admin/skills")
async def create_skill(data: SkillCreate, user=Depends(require_roles("admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: row=await db.fetchrow("INSERT INTO skills(name) VALUES($1) RETURNING id,name", data.name)
    return {"skill":record_to_dict(row)}
@app.put("/admin/assign-worker")
async def assign_worker_role(data: ChangeRoleRequest, user=Depends(require_roles("admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("UPDATE user_profile SET role='contractor' WHERE id=$1", data.user_id)
    return {"message":"worker role assigned"}
@app.put("/admin/ban")
async def ban_user(data: ChangeRoleRequest, user=Depends(require_roles("admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("UPDATE user_profile SET is_banned=true WHERE id=$1", data.user_id)
    return {"message":"user banned"}
@app.put("/admin/unban")
async def unban_user(data: ChangeRoleRequest, user=Depends(require_roles("admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("UPDATE user_profile SET is_banned=false WHERE id=$1", data.user_id)
    return {"message":"user unbanned"}
@app.delete("/admin/worker")
async def delete_worker(data: ChangeRoleRequest, user=Depends(require_roles("admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("DELETE FROM workers WHERE user_profile_id=$1", data.user_id); await db.execute("UPDATE user_profile SET role='user' WHERE id=$1", data.user_id)
    return {"message":"worker deleted"}

@app.post("/superadmin/create")
async def create_admin(data: CreateUserProfileRequest, user=Depends(require_roles("superadmin")), request: Request=None):
    admin_id=str(uuid.uuid4())
    async with request.app.state.db.acquire() as db: row=await db.fetchrow("INSERT INTO user_profile(id,email,phone,full_name,role,is_banned,created_at,updated_at) VALUES($1,$2,$3,$4,'admin',false,NOW(),NOW()) RETURNING id,email,phone,full_name,role,is_banned,created_at,updated_at", admin_id,data.email,data.phone,data.full_name)
    return {"admin":record_to_dict(row)}
@app.put("/superadmin/change-role")
async def admin_change_role(data: ChangeRoleRequest, user=Depends(require_roles("superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("UPDATE user_profile SET role=$2 WHERE id=$1", data.user_id, data.role)
    return {"message":"role changed"}
@app.delete("/superadmin/delete")
async def delete_admin(data: ChangeRoleRequest, user=Depends(require_roles("superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("DELETE FROM user_profile WHERE id=$1", data.user_id)
    return {"message":"admin deleted"}
@app.get("/superadmin/list")
async def get_admin_list(page:int=1, limit:int=20, user=Depends(require_roles("superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: rows=await db.fetch("SELECT id,email,phone,full_name,role,is_banned,created_at,updated_at FROM user_profile WHERE role='admin' ORDER BY created_at DESC LIMIT $1 OFFSET $2", limit, max(page-1,0)*limit)
    return {"admins":[record_to_dict(r) for r in rows]}
@app.get("/validate-token")
async def validate(user: dict = Depends(decode_current_user)): return {"valid":True,"user_id":user['user_id'],"role":user['role']}
