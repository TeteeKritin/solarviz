import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.base import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

# Use a safe default hasher for the seed script to avoid bcrypt runtime issues
ctx = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def seed():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Users already exist. Skipping admin seed.")
            return

        email = os.getenv("ADMIN_EMAIL", "admin@solarviz.local")
        password = os.getenv("ADMIN_PASSWORD", "Admin1234!")
        full_name = os.getenv("ADMIN_FULL_NAME", "Admin")

        hashed = ctx.hash(password)
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hashed,
            role="admin",
        )
        db.add(user)
        db.commit()
        print(f"Seeded admin user: {email}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
