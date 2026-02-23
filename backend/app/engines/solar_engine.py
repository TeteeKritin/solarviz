from sqlalchemy.orm import Session
from app.models.solar_intensity import SolarIntensity
from app.models.solar_config import SolarConfig
from typing import List, Dict

MJ_TO_KWH = 0.2778  # 1 MJ = 0.2778 kWh

def get_monthly_psh(db: Session, province_id: int, district_id: int, subdistrict_id: int) -> Dict[int, float]:
    """Returns dict of month -> PSH (kWh/m²/day)"""
    records = db.query(SolarIntensity).filter(
        SolarIntensity.province_id == province_id,
        SolarIntensity.district_id == district_id,
        SolarIntensity.subdistrict_id == subdistrict_id,
    ).all()
    
    if not records:
        # Fallback to province average
        records = db.query(SolarIntensity).filter(
            SolarIntensity.province_id == province_id
        ).all()
    
    monthly_psh = {}
    for r in records:
        psh = r.intensity_mj_m2_day * MJ_TO_KWH
        if r.month not in monthly_psh:
            monthly_psh[r.month] = []
        monthly_psh[r.month].append(psh)
    
    return {month: sum(vals)/len(vals) for month, vals in monthly_psh.items()}

def estimate_monthly_generation(
    db: Session,
    config: SolarConfig,
    year_offset: int = 0  # 0 = first year, 1 = second year, etc.
) -> Dict[int, float]:
    """Returns dict of month -> estimated kWh generation"""
    psh_by_month = get_monthly_psh(db, config.province_id, config.district_id, config.subdistrict_id)
    
    degradation_factor = (1 - config.degradation_rate) ** year_offset
    
    monthly_kwh = {}
    days_in_month = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    
    for month in range(1, 13):
        psh = psh_by_month.get(month, 4.5)  # Default 4.5 PSH if missing
        days = days_in_month[month]
        
        generation = (
            config.system_capacity_kw
            * psh
            * config.performance_ratio
            * degradation_factor
            * days
        )
        monthly_kwh[month] = round(generation, 2)
    
    return monthly_kwh

def estimate_annual_generation(db: Session, config: SolarConfig, year_offset: int = 0) -> float:
    monthly = estimate_monthly_generation(db, config, year_offset)
    return round(sum(monthly.values()), 2)