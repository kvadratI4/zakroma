import httpx
import pytest
from fastapi import APIRouter, FastAPI
from pydantic import BaseModel, Field

from app.core.errors import AppError

PROBLEM_JSON = "application/problem+json"


class SignUp(BaseModel):
    login: str
    password: str = Field(min_length=8)


probe_router = APIRouter(prefix="/api/v1/_test")


@probe_router.get("/conflict")
async def raise_conflict() -> None:
    raise AppError("test_conflict", status=409, title="Конфликт", current={"version": 2})


@probe_router.post("/signup")
async def sign_up(body: SignUp) -> None:
    return None


@pytest.fixture
def app(app: FastAPI) -> FastAPI:
    app.include_router(probe_router)
    return app


async def test_app_error_is_rendered_as_problem(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/_test/conflict")

    assert response.status_code == 409
    assert response.headers["content-type"] == PROBLEM_JSON
    assert response.json() == {
        "type": "https://zakroma/errors/test-conflict",
        "title": "Конфликт",
        "status": 409,
        "code": "test_conflict",
        "current": {"version": 2},
    }


async def test_unknown_path_is_not_found_problem(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/nope")

    assert response.status_code == 404
    assert response.headers["content-type"] == PROBLEM_JSON
    assert response.json()["code"] == "not_found"


async def test_wrong_method_is_method_not_allowed_problem(client: httpx.AsyncClient) -> None:
    response = await client.post("/api/v1/health")

    assert response.status_code == 405
    assert response.headers["content-type"] == PROBLEM_JSON
    assert response.headers["allow"] == "GET"
    assert response.json()["code"] == "method_not_allowed"


async def test_validation_error_lists_fields_without_echoing_input(
    client: httpx.AsyncClient,
) -> None:
    response = await client.post("/api/v1/_test/signup", json={"password": "secret1"})

    assert response.status_code == 422
    assert response.headers["content-type"] == PROBLEM_JSON
    body = response.json()
    assert body["code"] == "validation_error"
    assert {tuple(e["loc"]) for e in body["errors"]} == {("body", "login"), ("body", "password")}
    assert all(set(e) == {"loc", "type", "msg"} for e in body["errors"])
    assert "secret1" not in response.text
