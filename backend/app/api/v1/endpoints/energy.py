from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.daily_summary import DailySummary
from app.models.monthly_summary import MonthlySummary
from app.models.energy_reading import EnergyReading
from app.schemas.energy import DailySummaryOut, MonthlySummaryOut, EnergyReadingOut

router = APIRouter(prefix="/energy", tags=["energy"])

@router.get("/live", response_model=EnergyReadingOut)
def get_live(db: Session = Depends(get_db), _=Depends(get_current_user)):
    reading = db.query(EnergyReading).order_by(EnergyReading.timestamp.desc()).first()
    if not reading:
        return {"solar_power_w": 0, "grid_power_w": 0, "load_power_w": 0, "timestamp": None}
    return reading

@router.get("/daily", response_model=List[DailySummaryOut])
def get_daily(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    return db.query(DailySummary).filter(
        DailySummary.date >= start,
        DailySummary.date <= end
    ).order_by(DailySummary.date).all()

@router.get("/monthly", response_model=List[MonthlySummaryOut])
def get_monthly(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    query = db.query(MonthlySummary)
    if year:
        query = query.filter(MonthlySummary.year == year)
    return query.order_by(MonthlySummary.year, MonthlySummary.month).all()