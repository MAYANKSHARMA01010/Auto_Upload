"""
ClipScheduler Backend Application Settings.
Uses pydantic-settings to load from environment variables / .env file.
"""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    APP_NAME: str = "ClipScheduler"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # JWT
    JWT_ACCESS_SECRET_KEY: str = "change-me-in-production"
    JWT_REFRESH_SECRET_KEY: str = "change-me-in-production-too"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    SERVER_PORT: int = 8000

    # Frontend URLs
    FRONTEND_LOCAL_URL: str = "http://localhost:3000"
    FRONTEND_HOSTED_URL: str = ""

    # Backend URLs
    BACKEND_LOCAL_URL: str = "http://localhost:8000"
    BACKEND_HOSTED_URL: str = ""

    # Database & Caching
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/clipscheduler"
    REDIS_LOCAL_URL: str = ""
    REDIS_HOSTED_URL: str = ""

    @property
    def active_redis_url(self) -> str:
        """Return active Redis URL (prefers REDIS_HOSTED_URL, fallback to REDIS_LOCAL_URL)."""
        return self.REDIS_HOSTED_URL or self.REDIS_LOCAL_URL

    # Cloudflare R2 / S3
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_ENDPOINT_URL: str = ""
    R2_BUCKET_NAME: str = "clipscheduler-videos"
    R2_PUBLIC_URL: str = ""

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@clipscheduler.io"

    # Platform OAuth Credentials
    YOUTUBE_CLIENT_ID: str = ""
    YOUTUBE_CLIENT_SECRET: str = ""
    YOUTUBE_REDIRECT_URI: str = ""

    INSTAGRAM_CLIENT_ID: str = ""
    INSTAGRAM_CLIENT_SECRET: str = ""
    INSTAGRAM_REDIRECT_URI: str = ""
    INSTAGRAM_FB_APP_ID: str = ""
    INSTAGRAM_FB_APP_SECRET: str = ""

    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""
    FACEBOOK_REDIRECT_URI: str = ""

    TIKTOK_CLIENT_KEY: str = ""
    TIKTOK_CLIENT_SECRET: str = ""
    TIKTOK_REDIRECT_URI: str = ""

    THREADS_CLIENT_ID: str = ""
    THREADS_CLIENT_SECRET: str = ""
    THREADS_REDIRECT_URI: str = ""

    X_API_KEY: str = ""
    X_API_SECRET: str = ""
    X_REDIRECT_URI: str = ""

    SNAPCHAT_CLIENT_ID: str = ""
    SNAPCHAT_CLIENT_SECRET: str = ""
    SNAPCHAT_REDIRECT_URI: str = ""

    # Gemini & Stock APIs
    GEMINI_API_KEY: str = ""
    PEXELS_API_KEY: str = ""
    GEMINI_PRIMARY_MODEL: str = ""
    GEMINI_CANDIDATE_MODEL: str = ""

    # Frontend URL Dynamic Property
    @property
    def FRONTEND_URL(self) -> str:
        """Active Frontend URL (prefers FRONTEND_HOSTED_URL, fallback to FRONTEND_LOCAL_URL)."""
        return self.FRONTEND_HOSTED_URL or self.FRONTEND_LOCAL_URL


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


settings = get_settings()
