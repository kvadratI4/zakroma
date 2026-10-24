"""Errors as RFC 9457 `application/problem+json` with a stable `code` (docs/03-architecture.md)."""

from collections.abc import Mapping
from typing import Any, cast

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict
from starlette.exceptions import HTTPException as StarletteHTTPException

PROBLEM_JSON = "application/problem+json"
PROBLEM_TYPE_BASE = "https://zakroma/errors/"

# Titles are a human-readable fallback; the frontend translates `code` via i18n.
_HTTP_CODES: dict[int, tuple[str, str]] = {
    400: ("bad_request", "Некорректный запрос"),
    401: ("unauthorized", "Требуется вход"),
    403: ("forbidden", "Доступ запрещён"),
    404: ("not_found", "Не найдено"),
    405: ("method_not_allowed", "Метод не поддерживается"),
}
_GENERIC_HTTP = ("http_error", "Ошибка запроса")
VALIDATION_ERROR = ("validation_error", "Некорректные данные")
INTERNAL_ERROR = ("internal_error", "Внутренняя ошибка сервера")


class Problem(BaseModel):
    """Error body (RFC 9457); the UI translates `code`, `title` is a fallback text."""

    # Scenario errors add their own fields, e.g. `current` of 409 version_conflict.
    model_config = ConfigDict(extra="allow")

    type: str
    title: str
    status: int
    code: str
    detail: str | None = None


class ValidationIssue(BaseModel):
    loc: list[str | int]
    type: str
    msg: str


class ValidationProblem(Problem):
    """422 validation_error: which fields failed; submitted values are never echoed."""

    errors: list[ValidationIssue]


class AppError(Exception):
    """Base for expected errors raised by services; rendered by the global handler."""

    def __init__(
        self, code: str, *, status: int, title: str, detail: str | None = None, **extra: Any
    ) -> None:
        super().__init__(code)
        self.code = code
        self.status = status
        self.title = title
        self.detail = detail
        self.extra = extra


def problem_body(
    *, code: str, status: int, title: str, detail: str | None = None, **extra: Any
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "type": PROBLEM_TYPE_BASE + code.replace("_", "-"),
        "title": title,
        "status": status,
        "code": code,
    }
    if detail is not None:
        body["detail"] = detail
    body.update(extra)
    return body


def problem_response(
    *,
    code: str,
    status: int,
    title: str,
    detail: str | None = None,
    headers: Mapping[str, str] | None = None,
    **extra: Any,
) -> JSONResponse:
    return JSONResponse(
        problem_body(code=code, status=status, title=title, detail=detail, **extra),
        status_code=status,
        headers=headers,
        media_type=PROBLEM_JSON,
    )


async def _handle_app_error(request: Request, exc: Exception) -> JSONResponse:
    # The handler registry is typed with Exception; Starlette dispatches by class.
    exc = cast(AppError, exc)
    return problem_response(
        code=exc.code, status=exc.status, title=exc.title, detail=exc.detail, **exc.extra
    )


async def _handle_http_error(request: Request, exc: Exception) -> JSONResponse:
    exc = cast(StarletteHTTPException, exc)
    code, title = _HTTP_CODES.get(exc.status_code, _GENERIC_HTTP)
    return problem_response(code=code, status=exc.status_code, title=title, headers=exc.headers)


async def _handle_validation_error(request: Request, exc: Exception) -> JSONResponse:
    exc = cast(RequestValidationError, exc)
    # Only loc/type/msg: `input` and `ctx` may contain submitted values such as passwords.
    errors = [{"loc": list(e["loc"]), "type": e["type"], "msg": e["msg"]} for e in exc.errors()]
    code, title = VALIDATION_ERROR
    return problem_response(code=code, status=422, title=title, errors=errors)


def install_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _handle_app_error)
    app.add_exception_handler(StarletteHTTPException, _handle_http_error)
    app.add_exception_handler(RequestValidationError, _handle_validation_error)
