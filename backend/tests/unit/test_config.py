import secrets
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.core.config import Settings

SETTINGS_ENV = ("ENVIRONMENT", "LOG_LEVEL", "LOG_FORMAT", "DATABASE_URL")
PASSWORD = secrets.token_urlsafe(16)  # generated: no credential-like literals in the repo
DATABASE_URL = f"postgresql+asyncpg://zakroma:{PASSWORD}@127.0.0.1:5432/zakroma"


def load_settings() -> Settings:
    # Only the process environment: the developer's deploy/.env.dev must not leak into tests.
    return Settings(_env_file=None)


@pytest.fixture(autouse=True)
def clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in SETTINGS_ENV:
        monkeypatch.delenv(name, raising=False)
    # DATABASE_URL is required since T-003; the tests below are about the other settings.
    monkeypatch.setenv("DATABASE_URL", DATABASE_URL)


def test_settings_have_defaults_without_env() -> None:
    settings = load_settings()

    assert settings.environment == "dev"
    assert settings.log_level == "INFO"
    assert settings.log_format == "json"


def test_settings_are_read_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "prod")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")
    monkeypatch.setenv("LOG_FORMAT", "console")

    settings = load_settings()

    assert settings.environment == "prod"
    assert settings.log_level == "DEBUG"
    assert settings.log_format == "console"


@pytest.mark.parametrize(
    ("name", "value"),
    [("ENVIRONMENT", "staging"), ("LOG_LEVEL", "LOUD"), ("LOG_FORMAT", "xml")],
    ids=["environment", "log_level", "log_format"],
)
def test_invalid_setting_is_rejected(
    monkeypatch: pytest.MonkeyPatch, name: str, value: str
) -> None:
    monkeypatch.setenv(name, value)

    with pytest.raises(ValidationError):
        load_settings()


def test_database_url_is_read_from_env() -> None:
    settings = load_settings()

    assert settings.database_url.get_secret_value() == DATABASE_URL


def test_database_url_is_required(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL")

    with pytest.raises(ValidationError, match="database_url"):
        load_settings()


def test_database_url_must_use_asyncpg_without_echoing_it(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DATABASE_URL", f"postgresql://zakroma:{PASSWORD}@127.0.0.1/zakroma")

    with pytest.raises(ValidationError) as error:
        load_settings()

    assert "postgresql+asyncpg" in str(error.value)
    assert PASSWORD not in str(error.value)


def test_database_password_is_hidden_in_repr_and_dumps() -> None:
    settings = load_settings()

    for text in (repr(settings), str(settings), settings.model_dump_json()):
        assert PASSWORD not in text


def test_env_file_is_read_and_postgres_variables_are_ignored(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("DATABASE_URL")
    env_file = tmp_path / ".env.dev"
    env_file.write_text(
        f"POSTGRES_USER=zakroma\nPOSTGRES_PASSWORD={PASSWORD}\nDATABASE_URL={DATABASE_URL}\n",
        encoding="utf-8",
    )

    settings = Settings(_env_file=env_file)

    assert settings.database_url.get_secret_value() == DATABASE_URL
