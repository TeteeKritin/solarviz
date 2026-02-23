import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.base import SessionLocal
from app.models.solar_intensity import SolarIntensity

MONTHS = ['January','February','March','April','May','June',
          'July','August','September','October','November','December']

def import_dataset(file_path: str):
    db = SessionLocal()
    try:
        if db.query(SolarIntensity).count() > 0:
            print("Dataset already imported. Skipping.")
            return

        print(f"Reading file: {file_path}")

        # Support both CSV and Excel
        path = Path(file_path)
        if path.suffix in ('.xlsx', '.xls'):
            import openpyxl
            wb = openpyxl.load_workbook(file_path)
            ws = wb.active
            raw_rows = list(ws.iter_rows(values_only=True))[1:]  # skip header
        elif path.suffix == '.csv':
            import csv
            with open(file_path, 'r') as f:
                reader = csv.DictReader(f)
                # CSV path: already has province_id, district_id, subdistrict_id, month, intensity
                records = []
                for row in reader:
                    records.append(SolarIntensity(
                        province_id=int(row['province_id']),
                        district_id=int(row['district_id']),
                        subdistrict_id=int(row['subdistrict_id']),
                        month=int(row['month']),
                        intensity_mj_m2_day=float(row['intensity_mj_m2_day']),
                    ))
                db.bulk_save_objects(records)
                db.commit()
                print(f"Imported {len(records)} records from CSV.")
                return
        else:
            print(f"Unsupported file type: {path.suffix}")
            return

        # Excel path: fill forward province/district, expand months
        records = []
        province_id = 0
        district_id = 0
        subdistrict_id = 0
        last_province = None
        last_district = None

        for row in raw_rows:
            province_name = row[0] if row[0] is not None else last_province
            district_name = row[1] if row[1] is not None else last_district

            if province_name != last_province:
                province_id += 1
                district_id = 0
                last_province = province_name

            if district_name != last_district:
                district_id += 1
                subdistrict_id = 0
                last_district = district_name

            subdistrict_id += 1

            for m_idx in range(1, 13):
                intensity = row[4 + m_idx]  # col5=Jan, col6=Feb, ...
                if intensity is not None:
                    records.append(SolarIntensity(
                        province_id=province_id,
                        district_id=district_id,
                        subdistrict_id=subdistrict_id,
                        month=m_idx,
                        intensity_mj_m2_day=float(intensity),
                    ))

        db.bulk_save_objects(records)
        db.commit()
        print(f"Imported {len(records)} records from Excel.")

    finally:
        db.close()

if __name__ == "__main__":
    import_dataset("/app/data/data_solar_intensity_2560.xlsx")