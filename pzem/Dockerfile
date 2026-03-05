FROM python:3.11-slim-bookworm

WORKDIR /app

RUN pip install --no-cache-dir pymodbus==3.6.1 pyserial requests

COPY pzem_reader.py .

CMD ["python", "-u", "pzem_reader.py"]