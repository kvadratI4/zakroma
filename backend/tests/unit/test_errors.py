from app.core.errors import AppError, problem_body


def test_problem_body_has_rfc9457_fields_and_extras() -> None:
    body = problem_body(
        code="version_conflict",
        status=409,
        title="Данные изменились",
        detail="Партия изменена другим участником",
        current={"version": 3},
    )

    assert body == {
        "type": "https://zakroma/errors/version-conflict",
        "title": "Данные изменились",
        "status": 409,
        "code": "version_conflict",
        "detail": "Партия изменена другим участником",
        "current": {"version": 3},
    }


def test_problem_body_omits_missing_detail() -> None:
    body = problem_body(code="not_found", status=404, title="Не найдено")

    assert "detail" not in body


def test_app_error_keeps_problem_fields() -> None:
    error = AppError("version_conflict", status=409, title="Данные изменились", current={"v": 1})

    assert error.code == "version_conflict"
    assert error.status == 409
    assert error.title == "Данные изменились"
    assert error.detail is None
    assert error.extra == {"current": {"v": 1}}
