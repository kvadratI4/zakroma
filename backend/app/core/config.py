from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["dev", "test", "prod"]
LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR"]
LogFormat = Literal["json", "console"]


class Settings(BaseSettings):
    """Application settings from environment variables (no prefix, see docs/09-deployment.md)."""

    model_config = SettingsConfigDict(frozen=True)

    environment: Environment = "dev"
    log_level: LogLevel = "INFO"
    log_format: LogFormat = "json"
