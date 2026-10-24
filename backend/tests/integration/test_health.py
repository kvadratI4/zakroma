import secrets
import time

import httpx
import pytest
from pydantic import SecretStr, ValidationError

from app.core.config import Settings
from app.main import create_app
from tests.http import serve


async def test_health_returns_ok(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == {"status": "ok", "db": "ok"}


async def test_openapi_schema_is_served_under_api_v1(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/openapi.json")

    assert response.status_code == 200
    assert "/api/v1/health" in response.json()["paths"]


async def test_docs_are_available_outside_prod(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/docs")

    assert response.status_code == 200


async def test_docs_are_hidden_in_prod(settings: Settings) -> None:
    app = create_app(settings.model_copy(update={"environment": "prod"}))
    async with serve(app) as client:
        docs = await client.get("/api/v1/docs")
        schema = await client.get("/api/v1/openapi.json")

    assert docs.status_code == 404
    assert schema.status_code == 200


def test_invalid_env_fails_at_startup(monkeypatch: pytest.MonkeyPatch) -> None:
    # A valid URL, so the failure comes from ENVIRONMENT and not from a missing database_url.
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://zakroma@127.0.0.1:5432/zakroma")
    monkeypatch.setenv("ENVIRONMENT", "staging")

    with pytest.raises(ValidationError, match="environment"):
        create_app()


async def test_health_reports_unavailable_db_without_leaking_credentials(
    settings: Settings, capsys: pytest.CaptureFixture[str]
) -> None:
    password = secrets.token_urlsafe(16)
    unreachable = f"postgresql+asyncpg://zakroma:{password}@127.0.0.1:1/zakroma"
    app = create_app(settings.model_copy(update={"database_url": SecretStr(unreachable)}))
    started = time.monotonic()
    async with serve(app) as client:
        response = await client.get("/api/v1/health")

    assert time.monotonic() - started < 5
    assert response.status_code == 503
    assert response.headers["content-type"] == "application/problem+json"
    assert response.json()["code"] == "db_unavailable"
    output = capsys.readouterr().out
    for leaked in (password, unreachable):
        assert leaked not in response.text
        assert leaked not in output
    assert any('"db_unavailable"' in line for line in output.splitlines())
