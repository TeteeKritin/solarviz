from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DEVICE_ID: str = "pi-solarviz-001"
    FIRMWARE_VERSION: str = "1.0.0"
    CLOUD_HEALTH_URL: Optional[str] = None
    CLOUD_SYNC_ENABLED: bool = False
    ENVIRONMENT: str = "production"

    class Config:
        env_file = ".env"

settings = Settings()