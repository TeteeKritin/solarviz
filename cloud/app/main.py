from fastapi import FastAPI
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.sql import func
from pydantic import BaseModel
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cloud:cloud_pass@localhost/solarviz_cloud")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase): pass

class DeviceHealth(Base):
    __tablename__ = "device_health"
    id = Column(Integer, primary_key=True)
    device_id = Column(String, index=True, nullable=False)
    firmware_version = Column(String)
    last_seen = Column(DateTime(timezone=True))
    uptime_seconds = Column(Float)
    cpu_percent = Column(Float)
    memory_percent = Column(Float)
    storage_used_gb = Column(Float)
    storage_total_gb = Column(Float)
    raw_payload = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

Base.metadata.create_all(engine)

class HeartbeatPayload(BaseModel):
    device_id: str
    firmware_version: str
    last_seen: str
    uptime_seconds: float
    cpu_percent: float
    memory_percent: float
    storage_used_gb: float
    storage_total_gb: float

app = FastAPI(title="SolarVIZ Cloud")

@app.post("/device/health")
def receive_health(payload: HeartbeatPayload):
    db = SessionLocal()
    try:
        record = DeviceHealth(
            device_id=payload.device_id,
            firmware_version=payload.firmware_version,
            last_seen=datetime.fromisoformat(payload.last_seen),
            uptime_seconds=payload.uptime_seconds,
            cpu_percent=payload.cpu_percent,
            memory_percent=payload.memory_percent,
            storage_used_gb=payload.storage_used_gb,
            storage_total_gb=payload.storage_total_gb,
            raw_payload=payload.model_dump(),
        )
        db.add(record)
        db.commit()
        return {"status": "received", "device_id": payload.device_id}
    finally:
        db.close()

@app.get("/device/{device_id}/status")
def device_status(device_id: str):
    db = SessionLocal()
    try:
        latest = db.query(DeviceHealth).filter(
            DeviceHealth.device_id == device_id
        ).order_by(DeviceHealth.created_at.desc()).first()
        
        if not latest:
            return {"status": "unknown", "device_id": device_id}
        
        minutes_ago = (datetime.utcnow() - latest.last_seen.replace(tzinfo=None)).total_seconds() / 60
        status = "online" if minutes_ago < 10 else "offline"
        
        return {
            "device_id": device_id,
            "status": status,
            "last_seen": latest.last_seen,
            "firmware": latest.firmware_version,
        }
    finally:
        db.close()