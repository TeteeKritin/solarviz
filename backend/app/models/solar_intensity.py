from sqlalchemy import Column, Integer, Float, String
from app.db.base import Base

class SolarIntensity(Base):
    __tablename__ = "data_solar_intensity_2560"

    id = Column(Integer, primary_key=True)
    province_id = Column(Integer, index=True)
    district_id = Column(Integer, index=True)
    subdistrict_id = Column(Integer, index=True)
    month = Column(Integer, nullable=False)
    intensity_mj_m2_day = Column(Float, nullable=False)