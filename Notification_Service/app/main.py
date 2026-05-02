
import os, json, asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from aiokafka import AIOKafkaConsumer

app=FastAPI(title="Notification Service FastAPI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
connections:set[WebSocket]=set()
consumer_task=None

async def broadcast(message:dict):
    dead=[]
    for ws in connections:
        try: await ws.send_json(message)
        except Exception: dead.append(ws)
    for ws in dead: connections.discard(ws)

async def consume():
    topics=os.getenv("KAFKA_TOPICS","user.events,request.events,auth.events").split(',')
    consumer=AIOKafkaConsumer(*topics, bootstrap_servers=os.getenv("KAFKA_BROKERS","kafka:9092"), group_id="notification-service")
    try:
        await consumer.start()
        async for msg in consumer:
            try: data=json.loads(msg.value.decode())
            except Exception: data={"raw":msg.value.decode(errors='ignore')}
            await broadcast(data)
    except Exception:
        await asyncio.sleep(5)
    finally:
        try: await consumer.stop()
        except Exception: pass

@app.on_event("startup")
async def startup():
    global consumer_task
    consumer_task=asyncio.create_task(consume())
@app.on_event("shutdown")
async def shutdown():
    if consumer_task: consumer_task.cancel()
@app.get("/health")
async def health(): return {"status":"ok","connections":len(connections)}
@app.websocket("/ws")
async def ws(websocket:WebSocket):
    await websocket.accept(); connections.add(websocket)
    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect:
        connections.discard(websocket)
