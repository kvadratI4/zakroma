import json
import logging

import pytest

from app.core.config import Settings
from app.core.logging import configure_logging

# Logging does not touch the database; the URL only satisfies the required setting.
DATABASE_URL = "postgresql+asyncpg://zakroma@127.0.0.1:5432/zakroma"


def test_uvicorn_logs_are_json_but_its_access_log_is_off(
    capsys: pytest.CaptureFixture[str],
) -> None:
    # Our middleware writes the access line; uvicorn's own would duplicate it.
    configure_logging(Settings(log_format="json", database_url=DATABASE_URL))

    logging.getLogger("uvicorn.error").info("server started")
    logging.getLogger("uvicorn.access").info('127.0.0.1 - "GET / HTTP/1.1" 200')

    lines = [json.loads(line) for line in capsys.readouterr().out.splitlines()]
    assert [line["event"] for line in lines] == ["server started"]
    assert lines[0]["logger"] == "uvicorn.error"


def test_console_format_is_human_readable(capsys: pytest.CaptureFixture[str]) -> None:
    configure_logging(Settings(log_format="console", database_url=DATABASE_URL))

    logging.getLogger("app").info("hello")

    output = capsys.readouterr().out
    assert "hello" in output
    assert not output.lstrip().startswith("{")
