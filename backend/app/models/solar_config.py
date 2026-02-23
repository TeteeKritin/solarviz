from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class SolarConfig(Base):
    __tablename__ = "solar_configs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    system_capacity_kw = Column(Float, nullable=False)        # e.g. 5.0 kW
    panel_count = Column(Integer, nullable=False)
    panel_efficiency = Column(Float, default=0.20)            # 20%
    performance_ratio = Column(Float, default=0.80)           # 80%
    degradation_rate = Column(Float, default=0.005)           # 0.5% per year
    installation_cost_thb = Column(Float, nullable=False)
    electricity_tariff_thb = Column(Float, default=4.20)      # THB/kWh
    tariff_escalation_rate = Column(Float, default=0.03)      # 3% per year
    province_id = Column(Integer, nullable=False)
    district_id = Column(Integer, nullable=False)
    subdistrict_id = Column(Integer, nullable=False)
    feed_in_tariff_thb = Column(Float, default=2.20)
    self_consumption_ratio = Column(Float, default=0.70)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())