from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Every value comes from the environment or `.env`.

    `DATABASE_URL` is required from Phase 2 for anything beyond `/health`; the engine is
    still created lazily so importing the app never touches a database.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    log_level: str = "INFO"
    database_url: str | None = None
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    # Public base URL of the web app, used in e-mails (password reset, invitations).
    app_base_url: str = "http://localhost:3000"

    # Auth (decision D3). The secret has no default on purpose outside development/test.
    jwt_secret: str = ""
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30
    password_reset_ttl_minutes: int = 60
    invitation_ttl_days: int = 7
    password_min_length: int = 10
    cookie_secure: bool = False
    cookie_domain: str | None = None

    # E-mail (decision D11): "console" logs messages; "capture" is for tests.
    email_provider: Literal["console", "capture"] = "console"

    # Evidence files (decision D9/D12): local disk until an S3-compatible backend is chosen.
    storage_backend: Literal["local"] = "local"
    storage_local_root: str = ".storage"
    evidence_max_bytes: int = 10 * 1024 * 1024

    # Calendar day used for "overdue" and snapshot buckets (D10). Per-organization timezone is
    # a later refinement; every Brazilian customer shares this one today.
    default_timezone: str = "America/Sao_Paulo"
    # A document whose validity ends within this many days is "vencendo" (D26).
    document_expiring_days: int = 30

    @field_validator("jwt_secret")
    @classmethod
    def _secret_required_in_production(cls, value: str, info) -> str:  # noqa: ANN001
        env = info.data.get("app_env", "development")
        if env == "production" and len(value) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters in production.")
        return value or "dev-only-insecure-secret-change-me"

    @field_validator("cookie_secure")
    @classmethod
    def _secure_cookies_in_production(cls, value: bool, info) -> bool:  # noqa: ANN001
        if info.data.get("app_env") == "production" and not value:
            raise ValueError("COOKIE_SECURE must be true in production (HTTPS only).")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
