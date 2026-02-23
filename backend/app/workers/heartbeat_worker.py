import httpx, shutil, psutil
from datetime import datetime, timezone
from app.db.base import SessionLocal
from app.core.config import settings
from app.models.outbox import OutboxEvent

def build_heartbeat_payload() -> dict:
    disk = shutil.disk_usage("/")
    return {
        "device_id": settings.DEVICE_ID,
        "firmware_version": settings.FIRMWARE_VERSION,
        "last_seen": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": int(psutil.boot_time()),
        "cpu_percent": psutil.cpu_percent(interval=0.5),
        "memory_percent": psutil.virtual_memory().percent,
        "storage_used_gb": round(disk.used / 1e9, 2),
        "storage_total_gb": round(disk.total / 1e9, 2),
    }

def try_send_heartbeat():
    if not settings.CLOUD_SYNC_ENABLED or not settings.CLOUD_HEALTH_URL:
        return

    db = SessionLocal()
    try:
        payload = build_heartbeat_payload()
        try:
            response = httpx.post(settings.CLOUD_HEALTH_URL, json=payload, timeout=10.0)
            response.raise_for_status()
            print(f"[Heartbeat] Sent: {response.status_code}")
        except Exception as e:
            db.add(OutboxEvent(event_type="heartbeat", payload=payload, attempts=1))
            db.commit()
            print(f"[Heartbeat] Queued to outbox: {e}")
    finally:
        db.close()

def flush_outbox():
    if not settings.CLOUD_SYNC_ENABLED or not settings.CLOUD_HEALTH_URL:
        return

    db = SessionLocal()
    try:
        pending = db.query(OutboxEvent).filter(
            OutboxEvent.is_sent == False,
            OutboxEvent.attempts < 5
        ).limit(10).all()

        for event in pending:
            try:
                response = httpx.post(settings.CLOUD_HEALTH_URL, json=event.payload, timeout=10.0)
                response.raise_for_status()
                event.is_sent = True
                event.sent_at = datetime.now(timezone.utc)
            except Exception:
                event.attempts += 1
                event.last_attempt_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()