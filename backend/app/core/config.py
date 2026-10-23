from pathlib import Path
from typing import Literal

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["dev", "test", "prod"]
LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR"]
LogFormat = Literal["json", "console"]

# Local development credentials (backend/scripts/init_dev_env.py); absent in deployed images.
DEV_ENV_FILE = Path(__file__).resolve().parents[3] / "deploy" / ".env.dev"
DATABASE_URL_SCHEME = "postgresql+asyncpg://"


class Settings(BaseSettings):
    """Application settings from environment variables (no prefix, see docs/09-deployment.md).

    Environment variables win over deploy/.env.dev, which is read only if it exists.
    """

    model_config = SettingsConfigDict(
        frozen=True,
        env_file=DEV_ENV_FILE,
        env_file_encoding="utf-8",
        # The same file carries POSTGRES_* variables for the database container.
        extra="ignore",
        # Validation errors must not echo the database URL with its password.
        hide_input_in_errors=True,
    )

    environment: Environment = "dev"
    log_level: LogLevel = "INFO"
    log_format: LogFormat = "json"
    database_url: SecretStr

    @field_validator("database_url")
    @classmethod
    def _require_asyncpg_driver(cls, value: SecretStr) -> SecretStr:
        if not value.get_secret_value().startswith(DATABASE_URL_SCHEME):
            raise ValueError(f"DATABASE_URL must start with {DATABASE_URL_SCHEME}")
        return value
