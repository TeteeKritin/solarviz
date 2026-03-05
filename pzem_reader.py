from pymodbus.client import ModbusSerialClient
import time
import requests
import logging

API_BASE     = "http://localhost/api/v1"
API_EMAIL    = "kritin.te@gmail.com"   # ← your email
API_PASSWORD = "reborn1212"               # ← your password
INTERVAL     = 60

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
log = logging.getLogger(__name__)

def get_token():
    while True:
        try:
            r = requests.post(f"{API_BASE}/auth/login",
                json={"email": API_EMAIL, "password": API_PASSWORD}, timeout=10)
            r.raise_for_status()
            log.info("Login successful")
            return r.json()["access_token"]
        except Exception as e:
            log.error("Login failed: %s — retrying in 10s", e)
            time.sleep(10)

client = ModbusSerialClient(port="/dev/ttyAMA0", baudrate=9600, timeout=1)
if not client.connect():
    log.error("Cannot connect to PZEM")
    raise SystemExit
log.info("Connected to PZEM")

token = get_token()

while True:
    try:
        result = client.read_input_registers(address=0, count=10, device_id=1)
        if result.isError():
            log.error("Read error: %s", result)
        else:
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

            log.info("PZEM → %.1fV  %.3fA  %.1fW  %.3fkWh  PF:%.2f",
                voltage, current, power, energy, pf)

            resp = requests.post(
                f"{API_BASE}/energy/reading",
                json={"solar_power_w": 0.0, "grid_power_w": 0.0,
                      "load_power_w": power, "source": "pzem"},
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            if resp.status_code == 401:
                log.warning("Token expired — refreshing")
                token = get_token()
            else:
                log.info("Posted ✓")

    except Exception as e:
        log.error("Error: %s", e)

    time.sleep(INTERVAL)
