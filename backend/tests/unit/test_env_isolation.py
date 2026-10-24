"""Tests do not depend on the developer's machine (T-006, AC-5; L-018, L-033)."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_tests_never_read_the_dev_env_file(monkeypatch: pytest.MonkeyPatch) -> None:
    # deploy/.env.dev holds the local database password; CI has no such file.
    monkeypatch.delenv("DATABASE_URL", raising=False)

    assert Settings.model_config.get("env_file") is None
    with pytest.raises(ValidationError, match="database_url"):
        Settings()
