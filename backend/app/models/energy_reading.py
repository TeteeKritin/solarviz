from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from app.db.base import Base

class EnergyReading(Base):
    __tablename__ = "energy_readings"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    solar_power_w = Column(Float, default=0.0)       # Current solar watts
    grid_power_w = Column(Float, default=0.0)         # Grid import (+) / export (-)
    load_power_w = Column(Float, default=0.0)         # Total consumption
    battery_soc = Column(Float, nullable=True)         # Battery state of charge %
    source = Column(String, default="sensor")          # sensor | simulated
    created_at = Column(DateTime(timezone=True), server_default=func.now())