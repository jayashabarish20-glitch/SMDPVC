from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.exc import ArgumentError
from sqlalchemy.engine import make_url


def _default_database_url() -> str:
    database_path = Path(__file__).resolve().parents[1] / "data" / "smdpvc.db"
    return f"sqlite+aiosqlite:///{database_path.as_posix()}"


def _get_env_file() -> Path:
    """Get path to .env file from backend directory."""
    backend_dir = Path(__file__).resolve().parents[1]
    env_file = backend_dir / ".env"
    return env_file


class Settings(BaseSettings):
    database_url: str = Field(
        default_factory=_default_database_url,
        validation_alias="DATABASE_URL",
    )
    cloudinary_cloud_name: str | None = Field(
        default=None,
        validation_alias="CLOUDINARY_CLOUD_NAME",
    )
    cloudinary_api_key: str | None = Field(
        default=None,
        validation_alias="CLOUDINARY_API_KEY",
    )
    cloudinary_api_secret: str | None = Field(
        default=None,
        validation_alias="CLOUDINARY_API_SECRET",
    )
    max_upload_size_bytes: int = Field(
        default=5 * 1024 * 1024,
        gt=0,
        validation_alias="MAX_UPLOAD_SIZE_BYTES",
    )
    cors_origins: list[str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173"],
        validation_alias="CORS_ORIGINS",
    )
    secret_key: str = Field(
        default="",
        validation_alias="SECRET_KEY",
    )
    jwt_algorithm: str = Field(
        default="HS256",
        validation_alias="JWT_ALGORITHM",
    )
    jwt_expiration_hours: int = Field(
        default=24,
        gt=0,
        validation_alias="JWT_EXPIRATION_HOURS",
    )
    admin_username: str | None = Field(
        default=None,
        validation_alias="ADMIN_USERNAME",
    )
    admin_email: str | None = Field(
        default=None,
        validation_alias="ADMIN_EMAIL",
    )
    admin_password: str | None = Field(
        default=None,
        validation_alias="ADMIN_PASSWORD",
    )

    # --- Public AI chatbot (Gemini). The key is a SecretStr so it never appears in repr/logs.
    gemini_api_key: SecretStr | None = Field(
        default=None,
        validation_alias="GEMINI_API_KEY",
    )
    # Model choice measured 2026-11-25 (see chatbot performance report): the lite models with
    # minimal thinking answer in ~1-2s; the larger flash models were overloaded/quota-limited.
    gemini_model: str = Field(
        default="gemini-3.5-flash-lite",
        min_length=1,
        validation_alias="GEMINI_MODEL",
    )
    # Comma-separated, tried in order. Verified on this API key 2026-11-25: gemini-3.5-flash-lite
    # (primary) and gemini-3.5-flash generated text; gemini-3.1-flash-lite worked earlier the same
    # day but was returning 503 "high demand". GEMINI_FALLBACK_MODEL (singular) is still accepted.
    gemini_fallback_models: str = Field(
        default="gemini-3.5-flash,gemini-3.1-flash-lite",
        validation_alias=AliasChoices("GEMINI_FALLBACK_MODELS", "GEMINI_FALLBACK_MODEL"),
    )
    # "minimal" | "low" | "medium" | "high" | "default" (model default). Models that reject the
    # level are retried automatically without it.
    gemini_thinking_level: str = Field(
        default="minimal",
        pattern=r"^(default|minimal|low|medium|high)$",
        validation_alias="GEMINI_THINKING_LEVEL",
    )
    # Max wait for one chunk (first token or between chunks) before giving up on a model.
    gemini_timeout_seconds: float = Field(
        default=20.0,
        gt=0,
        le=120,
        validation_alias="GEMINI_TIMEOUT_SECONDS",
    )
    # If the primary model has not produced its first token after this long, the fallback model
    # is started in parallel and whichever streams first is used (hedged request).
    gemini_hedge_after_seconds: float = Field(
        default=4.0,
        gt=0,
        le=60,
        validation_alias="GEMINI_HEDGE_AFTER_SECONDS",
    )
    # Public-knowledge cache lifetime. Every request still validates the cache with one cheap
    # fingerprint query, and content writes in this process invalidate it immediately.
    chat_knowledge_cache_seconds: float = Field(
        default=60.0,
        ge=0,
        le=3600,
        validation_alias="CHAT_KNOWLEDGE_CACHE_SECONDS",
    )
    chat_rate_limit_per_minute: int = Field(
        default=10,
        gt=0,
        validation_alias="CHAT_RATE_LIMIT_PER_MINUTE",
    )
    chat_max_message_chars: int = Field(
        default=1000,
        gt=0,
        le=5000,
        validation_alias="CHAT_MAX_MESSAGE_CHARS",
    )

    model_config = SettingsConfigDict(
        env_file=_get_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def gemini_fallback_model_list(self) -> list[str]:
        """GEMINI_FALLBACK_MODELS parsed into an ordered, de-duplicated list (primary excluded)."""
        out: list[str] = []
        for name in (part.strip() for part in self.gemini_fallback_models.split(",")):
            if name and name != self.gemini_model and name not in out:
                out.append(name)
        return out

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if not value or len(value.strip()) == 0:
            raise ValueError("SECRET_KEY must be set in environment variables")
        return value

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        try:
            url = make_url(value)
        except (ArgumentError, ValueError) as exc:
            raise ValueError("DATABASE_URL must be a valid SQLite async URL") from exc

        if url.drivername != "sqlite+aiosqlite":
            raise ValueError("DATABASE_URL must use the sqlite+aiosqlite scheme")
        if url.database in (None, ""):
            raise ValueError("DATABASE_URL must specify a SQLite database path")
        if url.database == ":memory:":
            return value
        if not Path(url.database).is_absolute():
            path = Path(__file__).resolve().parents[1] / url.database
            url = url.set(database=str(path.resolve()))
        return url.render_as_string(hide_password=False)


@lru_cache
def get_settings() -> Settings:
    return Settings()
