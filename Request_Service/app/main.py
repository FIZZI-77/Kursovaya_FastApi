
import uuid
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from .common import get_db_pool, get_redis, KafkaPublisher, decode_current_user, require_roles, record_to_dict
from .schemas import RequestCreate, GetUserRequestsInput, IDRequestInput, AddPhotosRequest, RemovePhotosRequest, AssignWorkerToRequest, RequestListInput

app=FastAPI(title="Request Service FastAPI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
publisher=KafkaPublisher("request.events")
@app.on_event("startup")
async def startup(): app.state.db=await get_db_pool(); app.state.redis=await get_redis(); await publisher.start()
@app.on_event("shutdown")
async def shutdown(): await publisher.stop(); await app.state.db.close(); await app.state.redis.aclose()
@app.get("/")
async def root(): return {"message":"Request Service is running"}
@app.get("/health")
async def health(): return {"status":"ok"}

def summary(r): return record_to_dict(r)

@app.post("/user/requests")
async def create_request(data: RequestCreate, user=Depends(require_roles("user","contractor","admin","superadmin")), request: Request=None):
    rid=uuid.uuid4()
    async with request.app.state.db.acquire() as db:
        row=await db.fetchrow("""INSERT INTO requests(id,user_id,category,description,address,priority,status,photos,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,'new',$7,NOW(),NOW()) RETURNING id,user_id,worker_id,category,description,address,priority,status,photos,created_at,updated_at""", rid,user['user_id'],data.category,data.description,data.address,data.priority,data.photos or [])
    await publisher.publish("request_created","RequestService",str(user['user_id']),{"request_id":str(rid)})
    return {"message":"request created successfully","request":summary(row)}

@app.post("/user/requests/list")
async def get_requests(data: GetUserRequestsInput, user=Depends(decode_current_user), request: Request=None):
    args=[user['user_id']]; where=["user_id=$1"]; n=2
    if data.status: where.append(f"status=${n}"); args.append(data.status); n+=1
    limit=data.page_size; offset=max(data.page-1,0)*limit
    q="SELECT id,user_id,category,address,priority,status,created_at FROM requests WHERE "+" AND ".join(where)+f" ORDER BY created_at DESC LIMIT ${n} OFFSET ${n+1}"
    async with request.app.state.db.acquire() as db: rows=await db.fetch(q,*args,limit,offset)
    return {"requests":[summary(r) for r in rows],"page":data.page,"page_size":data.page_size}
@app.delete("/user/requests/cancel")
async def cancel_request(data: IDRequestInput, user=Depends(decode_current_user), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("DELETE FROM requests WHERE user_id=$1 AND id=$2", user['user_id'], data.request_id)
    await publisher.publish("request_cancelled","RequestService",str(user['user_id']),{"request_id":str(data.request_id)})
    return {"message":"request canceled successfully"}
@app.post("/user/requests/photo")
async def add_photo(data: AddPhotosRequest, user=Depends(decode_current_user), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("UPDATE requests SET photos=COALESCE(photos,'{}'::text[]) || $1::text[], updated_at=NOW() WHERE id=$2 AND user_id=$3", [data.photo_url], data.request_id, user['user_id'])
    return {"message":"photo added successfully"}
@app.delete("/user/requests/photo")
async def remove_photo(data: RemovePhotosRequest, user=Depends(decode_current_user), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("UPDATE requests SET photos=ARRAY(SELECT unnest(photos) EXCEPT SELECT unnest($1::text[])), updated_at=NOW() WHERE id=$2 AND user_id=$3", data.photo_url, data.request_id, user['user_id'])
    return {"message":"photo removed successfully"}
@app.post("/user/request")
async def get_request_by_id(data: IDRequestInput, user=Depends(decode_current_user), request: Request=None):
    async with request.app.state.db.acquire() as db: row=await db.fetchrow("SELECT id,user_id,worker_id,category,description,address,priority,status,photos,created_at,updated_at FROM requests WHERE id=$1", data.request_id)
    if not row: raise HTTPException(404,"request not found")
    return {"request":summary(row)}

@app.get("/user/request")
async def get_request_by_id_query(request_id: uuid.UUID, user=Depends(decode_current_user), request: Request=None):
    return await get_request_by_id(IDRequestInput(request_id=request_id), user, request)

@app.put("/user/request")
async def update_request_status(body: dict, user=Depends(decode_current_user), request: Request=None):
    rid = body.get("request_id")
    status = body.get("status")
    if not rid or not status:
        raise HTTPException(400, "request_id and status are required")
    async with request.app.state.db.acquire() as db:
        row = await db.fetchrow("UPDATE requests SET status=$2, updated_at=NOW() WHERE id=$1 AND user_id=$3 RETURNING id,user_id,worker_id,category,description,address,priority,status,photos,created_at,updated_at", uuid.UUID(str(rid)), status, user['user_id'])
    if not row: raise HTTPException(404, "request not found")
    return {"message":"request updated successfully", "request": summary(row)}

@app.get("/worker/requests/available")
async def available(page:int=1, page_size:int=20, pageSize:int|None=None, user=Depends(require_roles("contractor","admin","superadmin")), request: Request=None):
    if pageSize is not None: page_size = pageSize
    async with request.app.state.db.acquire() as db: rows=await db.fetch("SELECT id,user_id,category,address,priority,status,created_at FROM requests WHERE status='new' AND worker_id IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2", page_size, max(page-1,0)*page_size)
    return {"requests":[summary(r) for r in rows],"page":page,"page_size":page_size}
@app.patch("/worker/requests/accept")
async def accept(data: IDRequestInput, user=Depends(require_roles("contractor","admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: res=await db.execute("UPDATE requests SET status='accepted', worker_id=$1, updated_at=NOW() WHERE id=$2 AND worker_id IS NULL AND status='new'", user['user_id'], data.request_id)
    await publisher.publish("request_accepted","RequestService",str(user['user_id']),{"request_id":str(data.request_id)})
    return {"message":"request accepted successfully", "result":res}
@app.patch("/worker/requests/done")
async def done(data: IDRequestInput, user=Depends(require_roles("contractor","admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("UPDATE requests SET status='done', updated_at=NOW() WHERE id=$1 AND worker_id=$2", data.request_id, user['user_id'])
    await publisher.publish("request_done","RequestService",str(user['user_id']),{"request_id":str(data.request_id)})
    return {"message":"request marked as done"}
@app.get("/worker/requests/list")
async def worker_list(page:int=1,page_size:int=20,user=Depends(require_roles("contractor","admin","superadmin")),request:Request=None):
    async with request.app.state.db.acquire() as db: rows=await db.fetch("SELECT id,user_id,category,address,priority,status,created_at FROM requests WHERE worker_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", user['user_id'], page_size, max(page-1,0)*page_size)
    return {"requests":[summary(r) for r in rows]}

@app.post("/admin/requests/list")
async def all_requests(data: RequestListInput, user=Depends(require_roles("admin","superadmin")), request: Request=None):
    where=[]; args=[]; n=1
    for field in ['status','priority']:
        val=getattr(data,field)
        if val: where.append(f"{field}=${n}"); args.append(val); n+=1
    if data.user_id: where.append(f"user_id=${n}"); args.append(data.user_id); n+=1
    if data.worker_id: where.append(f"worker_id=${n}"); args.append(data.worker_id); n+=1
    if data.search: where.append(f"(category ILIKE ${n} OR description ILIKE ${n} OR address ILIKE ${n})"); args.append('%'+data.search+'%'); n+=1
    q="SELECT id,user_id,worker_id,category,description,address,priority,status,photos,created_at,updated_at FROM requests"+(" WHERE "+" AND ".join(where) if where else "")+f" ORDER BY created_at DESC LIMIT ${n} OFFSET ${n+1}"
    args += [data.page_size, max(data.page-1,0)*data.page_size]
    async with request.app.state.db.acquire() as db: rows=await db.fetch(q,*args)
    return {"requests":[summary(r) for r in rows]}
@app.patch("/admin/requests/assign")
async def assign_worker(data: AssignWorkerToRequest, user=Depends(require_roles("admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("UPDATE requests SET worker_id=$2,status='accepted',updated_at=NOW() WHERE id=$1", data.request_id, data.worker_id if data.worker_id else None)
    return {"message":"worker assigned successfully"}
@app.patch("/admin/requests/archive")
async def archive(data: IDRequestInput, user=Depends(require_roles("admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("UPDATE requests SET status='archived',updated_at=NOW() WHERE id=$1", data.request_id)
    return {"message":"request archived successfully"}
@app.delete("/admin/requests/delete")
async def delete(data: IDRequestInput, user=Depends(require_roles("admin","superadmin")), request: Request=None):
    async with request.app.state.db.acquire() as db: await db.execute("DELETE FROM requests WHERE id=$1", data.request_id)
    return {"message":"request deleted successfully"}
@app.get("/validate-token")
async def validate(user=Depends(decode_current_user)): return {"valid":True,"user_id":user['user_id'],"role":user['role']}
