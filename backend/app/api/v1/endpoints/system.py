import shutil, psutil, platform
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter()

class HealthResponse(BaseModel):
    device_id: str
    firmware: str
    timestamp: str
    cpu_percent: float
    memory_percent: float
    disk_used_gb: float
    disk_total_gb: float
    disk_percent: float
    uptime_seconds: int
    platform: str

@router.get("/health", response_model=HealthResponse)
def get_system_health(current_user: User = Depends(get_current_user)):
    disk = shutil.disk_usage("/")
    mem = psutil.virtual_memory()
    return HealthResponse(
        device_id=settings.DEVICE_ID,
        firmware=settings.FIRMWARE_VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        cpu_percent=psutil.cpu_percent(interval=0.5),
        memory_percent=mem.percent,
        disk_used_gb=round(disk.used / 1e9, 2),
        disk_total_gb=round(disk.total / 1e9, 2),
        disk_percent=round((disk.used / disk.total) * 100, 1),
        uptime_seconds=int(psutil.boot_time()),
        platform=platform.platform(),
    )

@router.get("/ping")
def ping():
    return {"status": "ok", "service": "solarviz-edge"}
