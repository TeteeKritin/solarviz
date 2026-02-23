#!/usr/bin/env python3
"""
Simple Modbus-RTU test for PZEM-like devices.

Usage:
  python pzem_test.py /dev/ttyUSB0 9600 1

This sends a Modbus Read Input Registers (0x04) request starting at address 0x0000
and prints the raw response (hex) so you can confirm the device replies.

Note: This is a diagnostic tool only. Adjust register/qty to fit your PZEM firmware.
"""
import sys
import serial
import time

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
    # Function 0x04 (Read Input Registers)
    frame = bytes([slave, 0x04, (addr >> 8) & 0xFF, addr & 0xFF, (qty >> 8) & 0xFF, qty & 0xFF])
    c = crc16(frame)
    return frame + bytes([c & 0xFF, (c >> 8) & 0xFF])

def main():
    if len(sys.argv) < 4:
        print("Usage: pzem_test.py <device> <baud> <slave_id>")
        sys.exit(1)

    dev = sys.argv[1]
    baud = int(sys.argv[2])
    slave = int(sys.argv[3])

    print(f"Opening {dev} @ {baud} baud, slave {slave}")
    try:
        ser = serial.Serial(dev, baudrate=baud, timeout=1)
    except Exception as e:
        print("Failed to open serial port:", e)
        sys.exit(2)

    # Read 10 registers starting at 0x0000 (tune if needed)
    req = build_read_input_request(slave, 0x0000, 10)
    print("Sending:", req.hex())
    ser.write(req)
    time.sleep(0.1)
    resp = ser.read(256)
    print("Received (hex):", resp.hex())
    if len(resp) == 0:
        print("No response. Check wiring, device power, and correct device path.")
    else:
        print("Raw bytes:", resp)

    ser.close()

if __name__ == '__main__':
    main()
