import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    PROJECT_NAME: str = "eRTMAC-NWIS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment & Demo Mode
    DEMO_MODE: bool = True
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nwis_demo.db")
    
    # JWT Auth
    SECRET_KEY: str = os.getenv("JWT_SECRET", "nwis-sih26121-oil-india-secure-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # AI / LLM / Embeddings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    EMBEDDING_API_KEY: Optional[str] = os.getenv("EMBEDDING_API_KEY", None)
    
    # Storage Paths
    MODEL_STORAGE_PATH: str = os.getenv("MODEL_STORAGE_PATH", "./models")
    DOCUMENT_STORAGE_PATH: str = os.getenv("DOCUMENT_STORAGE_PATH", "./data/documents")
    
    # Realtime Simulator
    SIMULATOR_TICK_SECONDS: float = 1.0
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()
