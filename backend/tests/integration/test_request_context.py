import json
import re
from datetime import datetime
from typing import Annotated, Any
from zoneinfo import ZoneInfo

import httpx
import pytest
from fastapi import APIRouter, Depends, FastAPI

from app.api.deps import get_clock
from app.core.clock import Clock, FixedClock
from app.core.config import Settings
from app.main import create_app

GENERATED_ID = re.compile(r"[0-9a-f]{32}")
MOSCOW_NOON = datetime(2026, 11, 10, 12, 0, tzinfo=ZoneInfo("Europe/Moscow"))

probe_router = APIRouter(prefix="/api/v1/_test")


@probe_router.get("/boom")
async def boom() -> None:
    raise RuntimeError("db password=xyz")


@probe_router.get("/now")
async def now(clock: Annotated[Clock, Depends(get_clock)]) -> dict[str, str]:
    return {"now": clock.now().isoformat()}


@pytest.fixture
def app(settings: Settings) -> FastAPI:
    app = create_app(settings, clock=FixedClock(MOSCOW_NOON))
    app.include_router(probe_router)
    return app


def log_lines(output: str) -> list[dict[str, Any]]:
    return [json.loads(line) for line in output.splitlines() if line.strip()]


async def test_request_id_is_generated_when_absent(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/health")

    assert GENERATED_ID.fullmatch(response.headers["x-request-id"])


async def test_safe_incoming_request_id_is_kept(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/health", headers={"X-Request-ID": "caddy-1.2_3"})

    assert response.headers["x-request-id"] == "caddy-1.2_3"


@pytest.mark.parametrize("incoming", ["x" * 65, "bad id!", ""], ids=["too-long", "unsafe", "empty"])
async def test_unsafe_incoming_request_id_is_replaced(
    client: httpx.AsyncClient, incoming: str
) -> None:
    response = await client.get("/api/v1/health", headers={"X-Request-ID": incoming})

    assert GENERATED_ID.fullmatch(response.headers["x-request-id"])


async def test_each_request_is_logged_as_one_json_line(
    client: httpx.AsyncClient, capsys: pytest.CaptureFixture[str]
) -> None:
    response = await client.get("/api/v1/health?token=s3cret")

    output = capsys.readouterr().out
    lines = log_lines(output)
    access = [line for line in lines if line["event"] == "http_request"]
    assert len(access) == 1
    assert access[0]["method"] == "GET"
    assert access[0]["path"] == "/api/v1/health"
    assert access[0]["status"] == 200
    assert isinstance(access[0]["duration_ms"], int | float)
    assert access[0]["request_id"] == response.headers["x-request-id"]
    assert "s3cret" not in output


async def test_unhandled_error_is_500_problem_without_details(
    client: httpx.AsyncClient, capsys: pytest.CaptureFixture[str]
) -> None:
    response = await client.get("/api/v1/_test/boom")

    assert response.status_code == 500
    assert response.headers["content-type"] == "application/problem+json"
    assert response.json()["code"] == "internal_error"
    assert "xyz" not in response.text
    assert "Traceback" not in response.text
    request_id = response.headers["x-request-id"]
    lines = log_lines(capsys.readouterr().out)
    error = next(line for line in lines if line["event"] == "unhandled_exception")
    assert error["request_id"] == request_id
    assert "RuntimeError" in error["exception"]
    access = next(line for line in lines if line["event"] == "http_request")
    assert access["status"] == 500


async def test_clock_dependency_returns_injected_clock(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/_test/now")

    assert response.json() == {"now": "2026-11-10T12:00:00+03:00"}


async def test_system_clock_is_used_by_default() -> None:
    app = create_app(Settings(environment="test"))
    app.include_router(probe_router)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/_test/now")

    assert datetime.fromisoformat(response.json()["now"]).utcoffset() is not None
