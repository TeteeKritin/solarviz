import os
import time
import logging
from datetime import datetime, timezone
import struct

from app.db.base import SessionLocal
from app.models.energy_reading import EnergyReading

import serial

logger = logging.getLogger("pzem_worker")

PZEM_DEVICE = os.getenv("PZEM_DEVICE", "/dev/ttyUSB0")
PZEM_BAUD = int(os.getenv("PZEM_BAUD", "9600"))
PZEM_SLAVE = int(os.getenv("PZEM_SLAVE", "1"))
POLL_SECONDS = int(os.getenv("PZEM_POLL_SECONDS", "5"))


def crc16(data: bytes) -> int:
    crc = 0xFFFF
    for pos in data:
        crc ^= pos
        for _ in range(8):
            if (crc & 0x0001) != 0:
                crc >>= 1
                crc ^= 0xA001
            else:
                crc >>= 1
    return crc


def build_read_input_request(slave: int, addr: int, qty: int) -> bytes:
    frame = bytes([slave, 0x04, (addr >> 8) & 0xFF, addr & 0xFF, (qty >> 8) & 0xFF, qty & 0xFF])
    c = crc16(frame)
    return frame + bytes([c & 0xFF, (c >> 8) & 0xFF])


def parse_response(resp: bytes):
    # Expect at least: slave, func(0x04), byte_count, data..., crc_lo, crc_hi
    if len(resp) < 5 or resp[1] != 0x04:
        return None
    byte_count = resp[2]
    data = resp[3:3+byte_count]
    if len(data) % 2 != 0:
        return None
    regs = struct.unpack('>' + 'H' * (len(data)//2), data)

    # Common PZEM mapping (community):
    # regs[0] -> voltage * 10
    # regs[1] -> current * 1000 (mA)
    # regs[3] -> power * 10
    # regs[5] -> energy (Wh)
    # regs[7] -> frequency * 10
    # regs[8] -> power factor * 100
    try:
        voltage = regs[0] / 10.0
        current = regs[1] / 1000.0
        power = regs[3] / 10.0
        energy_wh = regs[5]
        frequency = regs[7] / 10.0
        pf = regs[8] / 100.0
    except Exception:
        return None

    return {
        "voltage": voltage,
        "current": current,
        "power": power,
        "energy_wh": energy_wh,
        "frequency": frequency,
        "pf": pf,
    }


def poll_once(ser: serial.Serial):
    req = build_read_input_request(PZEM_SLAVE, 0x0000, 10)
    ser.reset_input_buffer()
    ser.write(req)
    time.sleep(0.1)
    resp = ser.read(256)
    if not resp:
        logger.debug("No response from PZEM")
        return None
    parsed = parse_response(resp)
    if not parsed:
        logger.debug("Unable to parse PZEM response: %s", resp.hex())
        return None
    return parsed


def run_loop():
    logger.info("Starting PZEM worker, device=%s baud=%s slave=%s", PZEM_DEVICE, PZEM_BAUD, PZEM_SLAVE)
    try:
        ser = serial.Serial(PZEM_DEVICE, baudrate=PZEM_BAUD, timeout=1)
    except Exception as e:
        logger.exception("Failed to open serial device: %s", e)
        return

    try:
        while True:
            try:
                data = poll_once(ser)
                if data:
                    db = SessionLocal()
                    try:
                        reading = EnergyReading(
                            timestamp=datetime.now(timezone.utc),
                            solar_power_w=data["power"],
                            grid_power_w=data["power"],
                            load_power_w=data["power"],
                            battery_soc=None,
                            source="pzem",
                        )
                        db.add(reading)
                        db.commit()
                        logger.info("Inserted reading: %s", data)
                    except Exception:
                        logger.exception("Failed to write reading to DB")
                        db.rollback()
                    finally:
                        db.close()
            except Exception:
                logger.exception("Unexpected error during PZEM poll")
            time.sleep(POLL_SECONDS)
    finally:
        ser.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run_loop()
