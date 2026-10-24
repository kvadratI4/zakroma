"""OpenAPI schema that describes errors as `application/problem+json` (docs/06-api.md).

The generated frontend client (ADR-0008) takes its error types from here, so the schema
must match what the handlers in `app.core.errors` actually return.
"""

from typing import Any

from fastapi import FastAPI
from fastapi.routing import APIRoute
from pydantic.json_schema import models_json_schema

from app.core.errors import PROBLEM_JSON, Problem, ValidationProblem

REF_TEMPLATE = "#/components/schemas/{model}"
# FastAPI's own validation error schemas: our handler renders ValidationProblem instead.
_FASTAPI_VALIDATION_SCHEMAS = ("HTTPValidationError", "ValidationError")


def operation_id(route: APIRoute) -> str:
    """operationId = the route function name (FastAPI warns if two routes share one)."""
    return route.name


def problem_response(description: str, model: type[Problem] = Problem) -> dict[str, Any]:
    """A `responses=` entry for an error a route raises on purpose, e.g. 503 db_unavailable."""
    ref = REF_TEMPLATE.format(model=model.__name__)
    return {"description": description, "content": {PROBLEM_JSON: {"schema": {"$ref": ref}}}}


def install_problem_openapi(app: FastAPI) -> None:
    build_schema = app.openapi

    def openapi() -> dict[str, Any]:
        schema = build_schema()  # cached by FastAPI in app.openapi_schema
        if "Problem" not in schema.get("components", {}).get("schemas", {}):
            _describe_problems(schema)
        return schema

    app.openapi = openapi  # type: ignore[method-assign]


def _describe_problems(schema: dict[str, Any]) -> None:
    components = schema.setdefault("components", {}).setdefault("schemas", {})
    for name in _FASTAPI_VALIDATION_SCHEMAS:
        components.pop(name, None)
    _, problem_schemas = models_json_schema(
        [(Problem, "serialization"), (ValidationProblem, "serialization")],
        ref_template=REF_TEMPLATE,
    )
    components.update(problem_schemas["$defs"])
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            responses = operation["responses"]
            # FastAPI adds 422 exactly where parameters or a body are validated.
            if "422" in responses:
                responses["422"] = problem_response("Validation error", ValidationProblem)
            responses.setdefault("default", problem_response("Error"))
