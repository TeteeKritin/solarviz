from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import shutil, psutil, platform
from datetime import datetime, timezone
from app.db.base import get_db
from app.core.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/health")
def system_health(_=Depends(get_current_user)):
    disk = shutil.disk_usage("/")
    mem = psutil.virtual_memory()
    cpu = psutil.cpu_percent(interval=1)
    
    return {
        "device_id": settings.DEVICE_ID,
        "firmware": settings.FIRMWARE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cpu_percent": cpu,
        "memory_percent": mem.percent,
        "disk_used_gb": round(disk.used / 1e9, 2),
        "disk_total_gb": round(disk.total / 1e9, 2),
        "disk_percent": round(disk.used / disk.total * 100, 1),
        "uptime_seconds": int(psutil.boot_time()),
        "platform": platform.machine(),
    }