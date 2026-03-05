import time
import logging
from pymodbus.client import ModbusSerialClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.db.base import SessionLocal
from app.models.energy_reading import EnergyReading
from app.core.config import settings

log = logging.getLogger(__name__)

client: ModbusSerialClient | None = None
consecutive_errors = 0
MAX_ERRORS = 3

def connect_pzem() -> ModbusSerialClient:
    c = ModbusSerialClient(
        port=settings.PZEM_PORT,
        baudrate=settings.PZEM_BAUDRATE,
        timeout=3,        # ← increased from 1 to 3
        retries=3,        # ← retry each read 3 times
        retry_on_empty=True,  # ← retry if empty response
    )
    if c.connect():
        log.info("PZEM connected on %s", settings.PZEM_PORT)
        time.sleep(1)     # ← give PZEM time to wake up
    else:
        log.error("PZEM connection failed on %s", settings.PZEM_PORT)
    return c

def read_and_save():
    global client, consecutive_errors

    # Initialize client on first run
    if client is None:
        client = connect_pzem()

    result = client.read_input_registers(
        address=0,
        count=10,
        device_id=settings.PZEM_DEVICE_ID,
    )

    if result.isError():
        consecutive_errors += 1
        log.error(
            "PZEM read error (%d/%d): %s",
            consecutive_errors, MAX_ERRORS, result
        )
        # Reconnect after too many consecutive errors
        if consecutive_errors >= MAX_ERRORS:
            log.warning("Reconnecting to PZEM...")
            try:
                client.close()
            except Exception:
                pass
            client = connect_pzem()
            consecutive_errors = 0
        return

    # Reset error counter on success
    consecutive_errors = 0

    r = result.registers
    voltage     = r[0] / 10.0
    current_raw = (r[2] << 16) | r[1]
    power_raw   = (r[4] << 16) | r[3]
    energy_raw  = (r[6] << 16) | r[5]
    current     = current_raw / 1000.0
    power       = power_raw   / 10.0
    energy      = energy_raw  / 1000.0
    freq        = r[7] / 10.0
    pf          = r[8] / 100.0

    log.info(
        "PZEM → %.1fV  %.3fA  %.1fW  %.3fkWh  %.1fHz  PF:%.2f",
        voltage, current, power, energy, freq, pf
    )

    db: Session = SessionLocal()
    try:
        reading = EnergyReading(
            timestamp=datetime.now(timezone.utc),
            solar_power_w=0.0,
            grid_power_w=0.0,
            load_power_w=power,
            source="pzem",
        )
        db.add(reading)
        db.commit()
        log.info("Saved to DB ✓")
    except Exception as e:
        log.error("DB save failed: %s", e)
        db.rollback()
    finally:
        db.close()