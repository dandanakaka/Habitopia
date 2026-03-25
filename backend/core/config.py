import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Habitopia"
    DEBUG: bool = False
    ALLOWED_HOSTS: List[str] = ["*"]  # Update this for production CORS

    # Firebase Configuration 
    # This must point to the path of your service account JSON file
    FIREBASE_SERVICE_ACCOUNT_PATH: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
    
    # Integration Secrets [cite: 7, 61]
    # Used by the services/integrations.py module
    GITHUB_TOKEN: str | None = None
    LEETCODE_SESSION_COOKIE: str | None = None

    # Village Mechanics (Global Constants) [cite: 11]
    VILLAGE_MAX_MEMBERS: int = 5
    VILLAGE_MIN_MEMBERS: int = 3
    DAILY_DECAY_CAP: int = 20  # Max health lost per day

    # Pydantic configuration to load from .env file
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()