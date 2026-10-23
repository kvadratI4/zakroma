import httpx
import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.main import create_app


async def test_health_returns_ok(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == {"status": "ok"}


async def test_openapi_schema_is_served_under_api_v1(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/openapi.json")

    assert response.status_code == 200
    assert "/api/v1/health" in response.json()["paths"]


async def test_docs_are_available_outside_prod(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/docs")

    assert response.status_code == 200


async def test_docs_are_hidden_in_prod() -> None:
    app = create_app(Settings(environment="prod"))
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        docs = await client.get("/api/v1/docs")
        schema = await client.get("/api/v1/openapi.json")

    assert docs.status_code == 404
    assert schema.status_code == 200


def test_invalid_env_fails_at_startup(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "staging")

    with pytest.raises(ValidationError):
        create_app()
