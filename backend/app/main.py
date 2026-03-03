from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api.v1.endpoints import auth, energy, finance, system
from app.workers.scheduler import start_scheduler

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="SolarVIZ Edge API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,    prefix="/api/v1/auth",    tags=["auth"])
app.include_router(energy.router,  prefix="/api/v1/energy",  tags=["energy"])
app.include_router(finance.router, prefix="/api/v1/finance", tags=["finance"])
app.include_router(system.router,  prefix="/api/v1/system",  tags=["system"])

@app.get("/api/v1/health")
def health():
    return {"status": "ok", "service": "solarviz-edge"}

scheduler_instance = None

@app.on_event("startup")
def on_startup():
    global scheduler_instance
    scheduler_instance = start_scheduler()

@app.on_event("shutdown")
def on_shutdown():
    global scheduler_instance
    if scheduler_instance:
        scheduler_instance.shutdown()
