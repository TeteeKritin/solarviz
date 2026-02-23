from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.solar_config import SolarConfig
from app.engines.roi_engine import calculate_roi
from app.engines.solar_engine import estimate_monthly_generation

router = APIRouter(prefix="/finance", tags=["finance"])

@router.get("/roi")
def get_roi(db: Session = Depends(get_db), _=Depends(get_current_user)):
    config = db.query(SolarConfig).filter(SolarConfig.is_active == True).first()
    if not config:
        raise HTTPException(404, "No active solar configuration found")
    return calculate_roi(db, config)

@router.get("/solar-estimate")
def get_solar_estimate(year_offset: int = 0, db: Session = Depends(get_db), _=Depends(get_current_user)):
    config = db.query(SolarConfig).filter(SolarConfig.is_active == True).first()
    if not config:
        raise HTTPException(404, "No active solar configuration found")
    monthly = estimate_monthly_generation(db, config, year_offset)
    return {"year_offset": year_offset, "monthly_kwh": monthly, "annual_kwh": sum(monthly.values())}