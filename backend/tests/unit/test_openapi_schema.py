"""The OpenAPI schema describes errors the way the handlers render them (T-005, AC-5)."""

from typing import Any

import pytest
from fastapi import APIRouter
from pydantic import BaseModel

from scripts.export_openapi import build_app

PROBLEM_JSON = "application/problem+json"
PROBLEM_REF = {"$ref": "#/components/schemas/Problem"}
VALIDATION_PROBLEM_REF = {"$ref": "#/components/schemas/ValidationProblem"}


class Probe(BaseModel):
    login: str


probe_router = APIRouter(prefix="/api/v1/_probe")


@probe_router.post("/body")
async def post_probe(body: Probe) -> None:
    return None


@pytest.fixture(scope="module")
def schema() -> dict[str, Any]:
    app = build_app()
    app.include_router(probe_router)
    return app.openapi()


def responses(schema: dict[str, Any], path: str, method: str) -> dict[str, Any]:
    result: dict[str, Any] = schema["paths"][path][method]["responses"]
    return result


def test_operation_ids_are_route_function_names(schema: dict[str, Any]) -> None:
    assert schema["paths"]["/api/v1/health"]["get"]["operationId"] == "get_health"


def test_problem_schemas_replace_fastapi_validation_schemas(schema: dict[str, Any]) -> None:
    components = schema["components"]["schemas"]

    assert {"Problem", "ValidationProblem", "ValidationIssue"} <= set(components)
    assert "HTTPValidationError" not in components
    assert "ValidationError" not in components
    problem = components["Problem"]
    assert set(problem["required"]) == {"type", "title", "status", "code"}
    # Scenario errors add their own fields, e.g. `current` of version_conflict.
    assert problem["additionalProperties"] is True


def test_every_operation_has_default_problem_response(schema: dict[str, Any]) -> None:
    for path, operations in schema["paths"].items():
        for method, operation in operations.items():
            default = operation["responses"].get("default")
            assert default is not None, (method, path)
            assert default["content"] == {PROBLEM_JSON: {"schema": PROBLEM_REF}}


def test_validated_operations_declare_validation_problem(schema: dict[str, Any]) -> None:
    unprocessable = responses(schema, "/api/v1/_probe/body", "post")["422"]

    assert unprocessable["content"] == {PROBLEM_JSON: {"schema": VALIDATION_PROBLEM_REF}}


def test_health_declares_db_unavailable_and_no_validation_error(schema: dict[str, Any]) -> None:
    health = responses(schema, "/api/v1/health", "get")

    assert health["503"]["content"] == {PROBLEM_JSON: {"schema": PROBLEM_REF}}
    assert "422" not in health  # no parameters, nothing to validate


def test_error_responses_never_claim_plain_json(schema: dict[str, Any]) -> None:
    for operations in schema["paths"].values():
        for operation in operations.values():
            for status, response in operation["responses"].items():
                if status == "default" or status >= "400":
                    assert set(response["content"]) == {PROBLEM_JSON}, status


def test_schema_is_built_once_per_app() -> None:
    app = build_app()

    assert app.openapi() is app.openapi()
