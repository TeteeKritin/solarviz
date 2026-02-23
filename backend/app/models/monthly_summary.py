from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class MonthlySummary(Base):
    __tablename__ = "monthly_summaries"

    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    solar_kwh = Column(Float, default=0.0)
    grid_import_kwh = Column(Float, default=0.0)
    grid_export_kwh = Column(Float, default=0.0)
    load_kwh = Column(Float, default=0.0)
    self_consumed_kwh = Column(Float, default=0.0)
    estimated_savings_thb = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())