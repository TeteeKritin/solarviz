from sqlalchemy.orm import Session
from sqlalchemy import cast, Date
from datetime import date
from app.db.base import SessionLocal
from app.models.energy_reading import EnergyReading
from app.models.daily_summary import DailySummary
from app.models.solar_config import SolarConfig

READING_INTERVAL_SECONDS = 60

def run_daily_aggregation(target_date: date = None):
    db: Session = SessionLocal()
    try:
        if target_date is None:
            target_date = date.today()

        readings = db.query(EnergyReading).filter(
            cast(EnergyReading.timestamp, Date) == target_date
        ).all()

        if not readings:
            print(f"[Aggregation] No readings for {target_date}")
            return

        config = db.query(SolarConfig).filter(SolarConfig.is_active == True).first()
        tariff = config.electricity_tariff_thb if config else 4.20

        interval_h = READING_INTERVAL_SECONDS / 3600

        solar_kwh = sum(r.solar_power_w * interval_h / 1000 for r in readings)
        load_kwh = sum(r.load_power_w * interval_h / 1000 for r in readings)
        grid_import_kwh = sum(r.grid_power_w * interval_h / 1000 for r in readings if r.grid_power_w > 0)
        grid_export_kwh = sum(abs(r.grid_power_w) * interval_h / 1000 for r in readings if r.grid_power_w < 0)
        self_consumed_kwh = max(0, solar_kwh - grid_export_kwh)
        peak_solar_w = max(r.solar_power_w for r in readings)
        savings = self_consumed_kwh * tariff

        existing = db.query(DailySummary).filter(DailySummary.date == target_date).first()
        if existing:
            existing.solar_kwh = solar_kwh
            existing.load_kwh = load_kwh
            existing.grid_import_kwh = grid_import_kwh
            existing.grid_export_kwh = grid_export_kwh
            existing.self_consumed_kwh = self_consumed_kwh
            existing.peak_solar_w = peak_solar_w
            existing.estimated_savings_thb = savings
        else:
            db.add(DailySummary(
                date=target_date,
                solar_kwh=solar_kwh,
                load_kwh=load_kwh,
                grid_import_kwh=grid_import_kwh,
                grid_export_kwh=grid_export_kwh,
                self_consumed_kwh=self_consumed_kwh,
                peak_solar_w=peak_solar_w,
                estimated_savings_thb=savings,
            ))

        db.commit()
        print(f"[Aggregation] Daily summary updated for {target_date}")
    finally:
        db.close()