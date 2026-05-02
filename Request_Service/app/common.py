
import os
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any

import asyncpg
import redis.asyncio as redis
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from aiokafka import AIOKafkaProducer

JWT_SALT = os.getenv("JWT_SALT", "fsfjh2p9urhwpuenn")
JWT_TTL_HOURS = int(os.getenv("JWT_TTL_HOURS", "12"))
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

async def get_db_pool() -> asyncpg.Pool:
    return await asyncpg.create_pool(
        host=os.getenv("DB_HOST", os.getenv("HOST", "db")),
        port=int(os.getenv("DB_PORT", os.getenv("PORT", "5432"))),
        user=os.getenv("DB_USER", os.getenv("DB_USERNAME", "postgres")),
        password=os.getenv("DB_PASSWORD", "qwerty"),
        database=os.getenv("DB_NAME", "servicedb"),
        min_size=1,
        max_size=10,
    )

async def get_redis() -> redis.Redis:
    return redis.Redis(
        host=os.getenv("REDIS_HOST", "redis"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        decode_responses=True,
    )

class KafkaPublisher:
    def __init__(self, topic: str):
        self.topic = topic
        self.producer: Optional[AIOKafkaProducer] = None

    async def start(self):
        brokers = os.getenv("KAFKA_BROKERS", "kafka:9092")
        self.producer = AIOKafkaProducer(bootstrap_servers=brokers)
        try:
            await self.producer.start()
        except Exception:
            self.producer = None

    async def stop(self):
        if self.producer:
            await self.producer.stop()

    async def publish(self, event_type: str, origin: str, user_id: str, payload: Dict[str, Any] | None = None):
        if not self.producer:
            return
        event = {
            "message_id": str(uuid.uuid4()),
            "event_type": event_type,
            "origin": origin,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "payload": payload or {},
        }
        await self.producer.send_and_wait(self.topic, json.dumps(event).encode("utf-8"))

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

async def create_token(user_id: str, role: str, rds: redis.Redis) -> str:
    now = datetime.now(timezone.utc)
    payload = {"user_id": user_id, "role": role, "iat": int(now.timestamp()), "exp": int((now + timedelta(hours=JWT_TTL_HOURS)).timestamp())}
    token = jwt.encode(payload, JWT_SALT, algorithm="HS256")
    await rds.setex(f"jwt:{token}", JWT_TTL_HOURS * 3600, user_id)
    return token

async def decode_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), request: Request = None) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing authorization header")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SALT, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
    rds = request.app.state.redis
    exists = await rds.get(f"jwt:{token}")
    if not exists:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token expired or revoked")
    return {"user_id": uuid.UUID(payload.get("user_id")), "role": payload.get("role"), "token": token}

def require_roles(*roles: str):
    async def dep(user: dict = Depends(decode_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="forbidden")
        return user
    return dep

def record_to_dict(row):
    if row is None:
        return None
    d=dict(row)
    for k,v in list(d.items()):
        if isinstance(v, datetime): d[k]=v.isoformat()
        elif isinstance(v, uuid.UUID): d[k]=str(v)
    return d
