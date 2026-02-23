from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class EnergyReadingOut(BaseModel):
    solar_power_w: float
    grid_power_w: float
    load_power_w: float
    timestamp: Optional[datetime]
    
    class Config:
        from_attributes = True

class DailySummaryOut(BaseModel):
    date: date
    solar_kwh: float
    grid_import_kwh: float
    grid_export_kwh: float
    load_kwh: float
    self_consumed_kwh: float
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