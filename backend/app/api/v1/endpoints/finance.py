from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.solar_config import SolarConfig
from app.engines.roi_engine import calculate_roi
from app.engines.solar_engine import estimate_monthly_generation

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────────────────────

class Cashflow(BaseModel):
    year: int
    annual_kwh: float
    tariff_thb: float
    savings_thb: float
    export_revenue_thb: float
    annual_benefit_thb: float
    cumulative_thb: float

class ROIOut(BaseModel):
    installation_cost_thb: float
    payback_year: Optional[float]
    npv_thb: float
    total_generation_kwh: float
    total_savings_thb: float
    cashflows: List[Cashflow]

class SolarEstimateOut(BaseModel):
    year_offset: int
    monthly_kwh: dict
    annual_kwh: float

# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/roi", response_model=ROIOut)
def get_roi(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    config = db.query(SolarConfig).filter(SolarConfig.is_active == True).first()
    if not config:
        return ROIOut(
            installation_cost_thb=0, payback_year=None, npv_thb=0,
            total_generation_kwh=0, total_savings_thb=0, cashflows=[],
        )
    result = calculate_roi(config, db)
    return ROIOut(
        installation_cost_thb=result["installation_cost_thb"],
        payback_year=result.get("payback_year"),
        npv_thb=result["npv_thb"],
        total_generation_kwh=result["total_generation_kwh"],
        total_savings_thb=result["total_savings_thb"],
        cashflows=[Cashflow(**c) for c in result["cashflows"]],
    )

@router.get("/solar-estimate", response_model=SolarEstimateOut)
def get_solar_estimate(
    year_offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    config = db.query(SolarConfig).filter(SolarConfig.is_active == True).first()
    if not config:
        # Return a default estimate for UI display even without config
        monthly = {str(m): 400 + 100 * abs(6 - m) for m in range(1, 13)}
        return SolarEstimateOut(year_offset=year_offset, monthly_kwh=monthly, annual_kwh=sum(monthly.values()))

    monthly_kwh = estimate_monthly_generation(config, db, year_offset=year_offset)
    annual = sum(monthly_kwh.values())
    return SolarEstimateOut(
        year_offset=year_offset,
        monthly_kwh={str(k): round(v, 2) for k, v in monthly_kwh.items()},
        annual_kwh=round(annual, 2),
    )
