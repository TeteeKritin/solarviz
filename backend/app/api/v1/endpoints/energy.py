from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date, func
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.energy_reading import EnergyReading
from app.models.daily_summary import DailySummary
from app.models.monthly_summary import MonthlySummary

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────────────────────

class LiveReadingOut(BaseModel):
    solar_power_w: float
    grid_power_w: float
    load_power_w: float
    timestamp: Optional[str]

class EnergyReadingIn(BaseModel):
    solar_power_w: float = 0.0
    grid_power_w: float = 0.0
    load_power_w: float = 0.0
    battery_soc: Optional[float] = None
    source: str = "sensor"

class DailySummaryOut(BaseModel):
    date: str
    solar_kwh: float
    grid_import_kwh: float
    grid_export_kwh: float
    load_kwh: float
    self_consumed_kwh: float
    peak_solar_w: float
    estimated_savings_thb: float

    class Config:
        from_attributes = True

class MonthlySummaryOut(BaseModel):
    year: int
    month: int
    solar_kwh: float
    grid_import_kwh: float
    grid_export_kwh: float
    load_kwh: float
    estimated_savings_thb: float

    class Config:
        from_attributes = True

# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/live", response_model=LiveReadingOut)
def get_live(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reading = (
        db.query(EnergyReading)
        .order_by(EnergyReading.timestamp.desc())
        .first()
    )
    if not reading:
        return LiveReadingOut(solar_power_w=0, grid_power_w=0, load_power_w=0, timestamp=None)
    return LiveReadingOut(
        solar_power_w=reading.solar_power_w,
        grid_power_w=reading.grid_power_w,
        load_power_w=reading.load_power_w,
        timestamp=reading.timestamp.isoformat(),
    )

@router.post("/reading", status_code=201)
def post_reading(
    payload: EnergyReadingIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reading = EnergyReading(
        timestamp=datetime.now(timezone.utc),
        solar_power_w=payload.solar_power_w,
        grid_power_w=payload.grid_power_w,
        load_power_w=payload.load_power_w,
        battery_soc=payload.battery_soc,
        source=payload.source,
    )
    db.add(reading)
    db.commit()
    return {"status": "ok"}

@router.get("/daily", response_model=List[DailySummaryOut])
def get_daily(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(DailySummary)
        .filter(DailySummary.date >= start, DailySummary.date <= end)
        .order_by(DailySummary.date.asc())
        .all()
    )
    return [
        DailySummaryOut(
            date=str(r.date),
            solar_kwh=r.solar_kwh,
            grid_import_kwh=r.grid_import_kwh,
            grid_export_kwh=r.grid_export_kwh,
            load_kwh=r.load_kwh,
            self_consumed_kwh=r.self_consumed_kwh,
            peak_solar_w=r.peak_solar_w or 0,
            estimated_savings_thb=r.estimated_savings_thb,
        )
        for r in rows
    ]

@router.get("/monthly", response_model=List[MonthlySummaryOut])
def get_monthly(
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(MonthlySummary)
        .filter(MonthlySummary.year == year)
        .order_by(MonthlySummary.month.asc())
        .all()
    )
    return [
        MonthlySummaryOut(
            year=r.year, month=r.month,
            solar_kwh=r.solar_kwh,
            grid_import_kwh=r.grid_import_kwh,
            grid_export_kwh=r.grid_export_kwh,
            load_kwh=r.load_kwh,
            estimated_savings_thb=r.estimated_savings_thb,
        )
        for r in rows
    ]
