from sqlalchemy.orm import Session
from app.models.solar_config import SolarConfig
from app.engines.solar_engine import estimate_annual_generation
from typing import List, Dict

def calculate_roi(db: Session, config: SolarConfig, years: int = 20) -> Dict:
    cashflows = []
    cumulative = -config.installation_cost_thb
    payback_year = None
    
    for year in range(1, years + 1):
        annual_kwh = estimate_annual_generation(db, config, year_offset=year - 1)
        tariff = config.electricity_tariff_thb * ((1 + config.tariff_escalation_rate) ** (year - 1))
        fit = config.feed_in_tariff_thb * ((1 + config.tariff_escalation_rate) ** (year - 1))
        
        self_consumed_kwh = annual_kwh * config.self_consumption_ratio
        exported_kwh = annual_kwh * (1 - config.self_consumption_ratio)
        
        savings_thb = self_consumed_kwh * tariff
        export_revenue_thb = exported_kwh * fit
        annual_benefit = savings_thb + export_revenue_thb
        
        cumulative += annual_benefit
        
        if cumulative >= 0 and payback_year is None:
            payback_year = year
        
        cashflows.append({
            "year": year,
            "annual_kwh": round(annual_kwh, 2),
            "tariff_thb": round(tariff, 4),
            "savings_thb": round(savings_thb, 2),
            "export_revenue_thb": round(export_revenue_thb, 2),
            "annual_benefit_thb": round(annual_benefit, 2),
            "cumulative_thb": round(cumulative, 2),
        })
    
    # NPV calculation (discount rate 5%)
    discount_rate = 0.05
    npv = -config.installation_cost_thb
    for i, cf in enumerate(cashflows, 1):
        npv += cf["annual_benefit_thb"] / ((1 + discount_rate) ** i)
    
    total_generation_kwh = sum(cf["annual_kwh"] for cf in cashflows)
    total_savings_thb = sum(cf["savings_thb"] + cf["export_revenue_thb"] for cf in cashflows)
    
    return {
        "installation_cost_thb": config.installation_cost_thb,
        "payback_year": payback_year,
        "npv_thb": round(npv, 2),
        "irr_approx": None,  # Can be added with scipy
        "total_generation_kwh": round(total_generation_kwh, 2),
        "total_savings_thb": round(total_savings_thb, 2),
        "cashflows": cashflows,
    }