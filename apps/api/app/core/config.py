from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
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

    # E-mail (decision D11): "console" logs messages; "capture" is for tests; "smtp" delivers
    # through any provider's relay (the vendor is still an open decision).
    email_provider: Literal["console", "capture", "smtp"] = "console"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str = ""
    smtp_security: Literal["starttls", "ssl", "none"] = "starttls"
    smtp_timeout_seconds: float = 10.0

    # Evidence and document files (decisions D9/D12): local disk for development and tests,
    # "s3" for any S3-compatible object store (the provider and region are still open).
    storage_backend: Literal["local", "s3"] = "local"
    storage_local_root: str = ".storage"
    s3_bucket: str = ""
    s3_region: str | None = None
    s3_endpoint_url: str | None = None
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None
    s3_key_prefix: str = ""
    evidence_max_bytes: int = 10 * 1024 * 1024

    # Calendar day used for "overdue" and snapshot buckets (D10). Per-organization timezone is
    # a later refinement; every Brazilian customer shares this one today.
    default_timezone: str = "America/Sao_Paulo"
    # A document whose validity ends within this many days is "vencendo" (D26).
    document_expiring_days: int = 30
    # Document-expiry digest: at most one per organization every this many days (Phase 10).
    reminder_interval_days: int = 7

    # Compliance Agent language model (decision D35). "none" keeps the deterministic agent only;
    # "anthropic" enables free-text questions grounded in the context bundle (docs/ai.md).
    llm_provider: Literal["none", "anthropic"] = "none"
    anthropic_api_key: str | None = None
    # Optional gateway/proxy in front of the Anthropic API (enterprise egress, local mocks).
    llm_base_url: str | None = None
    llm_model: str = "claude-opus-5"
    llm_effort: Literal["low", "medium", "high"] = "medium"
    llm_max_output_tokens: int = 2048
    llm_timeout_seconds: float = 45.0
    # Cost and abuse ceilings: questions per user per minute and per organization per hour.
    llm_user_minute_limit: int = 6
    llm_org_hourly_limit: int = 60

    @field_validator("database_url")
    @classmethod
    def _sqlalchemy_url(cls, value: str | None) -> str | None:
        """Managed providers hand out `postgres://` / `postgresql://` strings; SQLAlchemy needs the
        psycopg driver spelled out. Anything already explicit is left alone."""
        if value and value.startswith(("postgres://", "postgresql://")):
            return "postgresql+psycopg://" + value.split("://", 1)[1]
        return value

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

    @model_validator(mode="after")
    def _providers_configured(self) -> "Settings":
        if self.email_provider == "smtp" and not (self.smtp_host and self.smtp_from):
            raise ValueError("EMAIL_PROVIDER=smtp requires SMTP_HOST and SMTP_FROM.")
        if self.storage_backend == "s3" and not self.s3_bucket:
            raise ValueError("STORAGE_BACKEND=s3 requires S3_BUCKET.")
        if self.app_env == "production" and self.email_provider != "smtp":
            # Invitations and password resets would silently go to the log.
            raise ValueError("EMAIL_PROVIDER must be smtp in production.")
        if self.app_env == "production" and self.storage_backend != "s3":
            # Container filesystems are ephemeral: local files would vanish on the next deploy.
            raise ValueError("STORAGE_BACKEND must be s3 in production.")
        if self.app_env == "production" and not self.database_url:
            raise ValueError("DATABASE_URL is required in production.")
        if self.llm_provider == "anthropic" and not self.anthropic_api_key:
            raise ValueError("LLM_PROVIDER=anthropic requires ANTHROPIC_API_KEY.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
