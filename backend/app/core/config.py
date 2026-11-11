import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env.local", ".env", "../.env.local", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "LinkFlow"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & URLs
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Database
    # Default to SQLite for easy local execution if PostgreSQL is not active; docker-compose overrides with postgres
    DATABASE_URL: str = Field(
        default="sqlite:///./linkflow.db",
        description="PostgreSQL or SQLite connection string"
    )
    DATABASE_URL_UNPOOLED: Optional[str] = Field(
        default=None,
        description="Direct unpooled PostgreSQL connection string for migrations"
    )
    
    # Redis Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL_SECONDS: int = 86400  # 24 hours default TTL
    REDIS_ENABLED: bool = True

    # Security & JWT
    JWT_SECRET_KEY: str = Field(
        default="change-me-to-a-secure-random-32-character-secret-key",
        description="JWT secret key for signing authentication tokens"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Short code configuration
    SHORT_CODE_LENGTH: int = 7
    MAX_COLLISION_RETRIES: int = 5
    DEFAULT_REDIRECT_TYPE: int = 302  # 302 temporary or 301 permanent
    
    # Email / SMTP configuration
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@linkflow.local"
    SMTP_FROM_NAME: str = "LinkFlow"
    SMTP_TLS: bool = True
    
    # Rate Limiting
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10
    RATE_LIMIT_SHORTEN_PER_MINUTE: int = 30


settings = Settings()
