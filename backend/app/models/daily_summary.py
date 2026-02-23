from sqlalchemy import Column, Integer, Float, Date, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class DailySummary(Base):
    __tablename__ = "daily_summaries"

    id = Column(Integer, primary_key=True)
    date = Column(Date, unique=True, nullable=False, index=True)
    solar_kwh = Column(Float, default=0.0)
    grid_import_kwh = Column(Float, default=0.0)
    grid_export_kwh = Column(Float, default=0.0)
    load_kwh = Column(Float, default=0.0)
    self_consumed_kwh = Column(Float, default=0.0)
    peak_solar_w = Column(Float, default=0.0)
    estimated_savings_thb = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())