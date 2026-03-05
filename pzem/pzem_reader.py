import time
import requests
import logging
import os
from pymodbus.client import ModbusSerialClient

# ── Config from environment variables ────────────────────────────────────────
PZEM_PORT      = os.getenv("PZEM_PORT", "/dev/ttyAMA0")
PZEM_BAUDRATE  = int(os.getenv("PZEM_BAUDRATE", "9600"))
PZEM_DEVICE_ID = int(os.getenv("PZEM_DEVICE_ID", "1"))
API_BASE       = os.getenv("API_BASE", "http://backend:8000/api/v1")
API_EMAIL      = os.getenv("API_EMAIL", "admin@solarviz.local")
API_PASSWORD   = os.getenv("API_PASSWORD", "changeme")
READ_INTERVAL  = int(os.getenv("READ_INTERVAL", "60"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)
log = logging.getLogger(__name__)

# ── Auth ──────────────────────────────────────────────────────────────────────
def get_token() -> str:
    while True:
        try:
            r = requests.post(
                f"{API_BASE}/auth/login",
                json={"email": API_EMAIL, "password": API_PASSWORD},
                timeout=10,
            )
            r.raise_for_status()
            log.info("Login successful")
            return r.json()["access_token"]
        except Exception as e:
            log.error("Login failed: %s — retrying in 10s", e)
            time.sleep(10)

# ── Read PZEM ─────────────────────────────────────────────────────────────────
def read_pzem(client: ModbusSerialClient) -> dict | None:
    result = client.read_input_registers(
        address=0,
        count=10,
        device_id=PZEM_DEVICE_ID,
    )
    if result.isError():
        log.error("PZEM read error: %s", result)
        return None

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

    if current > 120:
        log.warning("Current out of range — check CT direction")

    log.info(
        "PZEM → %.1fV  %.3fA  %.1fW  %.3fkWh  %.1fHz  PF:%.2f",
        voltage, current, power, energy, freq, pf
    )

    return {
        "solar_power_w": 0.0,
        "grid_power_w":  0.0,
        "load_power_w":  power,   # PZEM on main load circuit
        "source": "pzem",
    }

# ── Post to API ───────────────────────────────────────────────────────────────
def post_reading(token: str, payload: dict) -> bool:
    try:
        r = requests.post(
            f"{API_BASE}/energy/reading",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if r.status_code == 401:
            log.warning("Token expired")
            return False
        r.raise_for_status()
        log.info("Posted ✓")
        return True
    except Exception as e:
        log.error("POST failed: %s", e)
        return True

# ── Main ──────────────────────────────────────────────────────────────────────
def connect_pzem() -> ModbusSerialClient:
    """Create and connect a fresh client — called on start and reconnect."""
    client = ModbusSerialClient(
        port=PZEM_PORT,
        baudrate=PZEM_BAUDRATE,
        timeout=1,
    )
    while not client.connect():
        log.error("Cannot connect to PZEM on %s — retrying in 5s", PZEM_PORT)
        time.sleep(5)
    log.info("Connected to PZEM")
    return client

def main():
    log.info("Starting PZEM reader — port:%s interval:%ds", PZEM_PORT, READ_INTERVAL)

    # Wait for backend to be ready
    log.info("Waiting for backend to start...")
    time.sleep(15)

    client = connect_pzem()
    token = get_token()

    consecutive_errors = 0
    MAX_ERRORS = 3   # reconnect after 3 consecutive failures

    while True:
        try:
            data = read_pzem(client)

            if data:
                consecutive_errors = 0   # reset on success
                success = post_reading(token, data)
                if not success:
                    token = get_token()
                    post_reading(token, data)
            else:
                consecutive_errors += 1
                log.warning(
                    "No data — consecutive errors: %d/%d",
                    consecutive_errors, MAX_ERRORS
                )

                if consecutive_errors >= MAX_ERRORS:
                    log.warning("Too many errors — reconnecting to PZEM...")
                    try:
                        client.close()
                    except Exception:
                        pass
                    time.sleep(2)
                    client = connect_pzem()
                    consecutive_errors = 0

        except KeyboardInterrupt:
            log.info("Stopped by user")
            break
        except Exception as e:
            log.error("Unexpected error: %s", e)
            consecutive_errors += 1

        time.sleep(READ_INTERVAL)

    client.close()
    log.info("PZEM reader stopped")

if __name__ == "__main__":
    main()