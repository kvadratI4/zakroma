import pytest
from pydantic import ValidationError

from app.core.config import Settings

SETTINGS_ENV = ("ENVIRONMENT", "LOG_LEVEL", "LOG_FORMAT")


@pytest.fixture(autouse=True)
def clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in SETTINGS_ENV:
        monkeypatch.delenv(name, raising=False)


def test_settings_have_defaults_without_env() -> None:
    settings = Settings()

    assert settings.environment == "dev"
    assert settings.log_level == "INFO"
    assert settings.log_format == "json"


def test_settings_are_read_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "prod")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")
    monkeypatch.setenv("LOG_FORMAT", "console")

    settings = Settings()

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
        Settings()
