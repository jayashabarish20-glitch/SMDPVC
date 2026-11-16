from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.exc import ArgumentError
from sqlalchemy.engine import make_url


def _default_database_url() -> str:
    database_path = Path(__file__).resolve().parents[1] / "data" / "smdpvc.db"
    return f"sqlite+aiosqlite:///{database_path.as_posix()}"


def _get_env_file() -> Path:
    """Get path to .env file (in project root, not backend directory)."""
    backend_dir = Path(__file__).resolve().parents[1]
    project_root = backend_dir.parent
    env_file = project_root / ".env"
    if env_file.exists():
        return env_file
    return Path(".env")


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

    model_config = SettingsConfigDict(
        env_file=_get_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

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
