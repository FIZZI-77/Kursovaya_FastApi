
import uuid
from datetime import timedelta
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from .common import get_db_pool, get_redis, KafkaPublisher, hash_password, verify_password, create_token, decode_current_user
from .schemas import SignUp, SignIn, ResetPasswordRequest, ResetPasswordConfirm

app = FastAPI(title="Auth Service FastAPI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
publisher = KafkaPublisher("auth.events")

@app.on_event("startup")
async def startup():
    app.state.db = await get_db_pool()
    app.state.redis = await get_redis()
    await publisher.start()

@app.on_event("shutdown")
async def shutdown():
    await publisher.stop(); await app.state.db.close(); await app.state.redis.aclose()

@app.get("/")
async def root(): return {"message":"Auth Service is running"}
@app.get("/health")
async def health(): return {"status":"ok"}

@app.post("/auth/sign-up")
@app.post("/sign-up")
async def sign_up(data: SignUp, request: Request):
    async with request.app.state.db.acquire() as db:
        exists = await db.fetchrow("SELECT user_id FROM users WHERE email=$1", data.email)
        if exists: raise HTTPException(400, "user already exists")
        user_id = uuid.uuid4()
        password = hash_password(data.password)
        row = await db.fetchrow("""
            INSERT INTO users (user_id,name,email,password,role,emailVerified,created_at,update_at)
            VALUES ($1,$2,$3,$4,'user',false,NOW(),NOW())
            RETURNING user_id,name,email,role,emailVerified,created_at,update_at
        """, user_id, data.name, data.email, password)
    token = await create_token(str(row['user_id']), row['role'], request.app.state.redis)
    email_token = str(uuid.uuid4())
    await request.app.state.redis.setex(f"email_verif:{email_token}", 3600, str(row['user_id']))
    await publisher.publish("signup", "AuthService", str(row['user_id']), {"email": data.email, "email_verification_token": email_token})
    return {"message":"user created successfully", "token": token, "user": {"id": str(row['user_id']), "name": row['name'], "email": row['email'], "role": row['role'], "email_verified": row['emailverified'], "created": row['created_at'], "updated": row['update_at']}}

@app.post("/auth/sign-in")
@app.post("/sign-in")
async def sign_in(data: SignIn, request: Request):
    async with request.app.state.db.acquire() as db:
        row = await db.fetchrow("SELECT user_id,password,role FROM users WHERE email=$1", data.email)
    if not row or not verify_password(data.password, row['password'] or ''):
        raise HTTPException(400, "incorrect email or password")
    token = await create_token(str(row['user_id']), row['role'], request.app.state.redis)
    await publisher.publish("login", "AuthService", str(row['user_id']), {"role": row['role']})
    return {"message":"user SignIn successfully", "token": token}

@app.post("/auth/sign-out")
@app.post("/sign-out")
async def sign_out(user: dict = Depends(decode_current_user), request: Request = None):
    await request.app.state.redis.delete(f"jwt:{user['token']}")
    return {"message":"user signed out successfully"}

@app.get("/auth/verify-email")
@app.get("/verify-email")
async def verify_email(token: str, request: Request):
    user_id = await request.app.state.redis.get(f"email_verif:{token}")
    if not user_id: raise HTTPException(400, "token not found or expired")
    async with request.app.state.db.acquire() as db:
        await db.execute("UPDATE users SET emailVerified=true WHERE user_id=$1", uuid.UUID(user_id))
    await request.app.state.redis.delete(f"email_verif:{token}")
    await publisher.publish("email_verified", "AuthService", user_id, {})
    return {"message":"email verified successfully"}

@app.post("/auth/verify-email")
@app.post("/verify-email")
async def verify_email_post(body: dict, request: Request):
    token = body.get("token")
    if not token:
        raise HTTPException(400, "missing token")
    return await verify_email(token, request)

@app.post("/auth/sign-reset-password-request")
@app.post("/sign-reset-password-request")
async def reset_password_request(data: ResetPasswordRequest, request: Request):
    async with request.app.state.db.acquire() as db:
        row = await db.fetchrow("SELECT user_id FROM users WHERE email=$1", data.email)
    if not row: raise HTTPException(404, "user not found")
    token = str(uuid.uuid4())
    await request.app.state.redis.setex(f"reset_password:{token}", 3600, data.email)
    await publisher.publish("password_reset_requested", "AuthService", str(row['user_id']), {"email": data.email, "reset_token": token})
    return {"message":"reset password token created", "token": token}

@app.post("/auth/sign-reset-password-confirm")
@app.post("/sign-reset-password-confirm")
async def reset_password_confirm(data: ResetPasswordConfirm, request: Request):
    email = await request.app.state.redis.get(f"reset_password:{data.token}")
    if not email or email != data.email: raise HTTPException(400, "invalid or expired token")
    async with request.app.state.db.acquire() as db:
        await db.execute("UPDATE users SET password=$1, update_at=NOW() WHERE email=$2", hash_password(data.new_password), data.email)
    await request.app.state.redis.delete(f"reset_password:{data.token}")
    return {"message":"password updated successfully"}

@app.get("/auth/validate-token")
@app.get("/validate-token")
async def validate(user: dict = Depends(decode_current_user)):
    return {"valid": True, "user_id": user["user_id"], "role": user["role"]}

@app.get("/google/login")
async def google_login():
    return {"message":"Google OAuth is not configured in this FastAPI port. Set CLIENT_ID/CLIENT_SECRET and implement provider callback if needed."}
@app.get("/google/callback")
async def google_callback():
    return {"message":"Google OAuth callback placeholder"}
