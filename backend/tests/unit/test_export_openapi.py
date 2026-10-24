"""Export of the API schema for the generated frontend client (T-005, AC-1, AC-3)."""

import json
from pathlib import Path

import pytest

from app.core.config import Settings
from scripts.export_openapi import DEFAULT_OUTPUT, build_app, main, render_openapi

REPO_ROOT = Path(__file__).resolve().parents[3]


def test_render_is_deterministic_sorted_utf8_with_final_newline() -> None:
    first = render_openapi(build_app())
    second = render_openapi(build_app())

    assert first == second
    assert first.endswith("}\n")
    assert "\\u" not in first  # Russian titles stay readable in diffs
    schema = json.loads(first)
    assert list(schema) == sorted(schema)
    assert list(schema["components"]["schemas"]) == sorted(schema["components"]["schemas"])


def test_export_writes_schema_file(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    output = tmp_path / "openapi.json"

    exit_code = main(["--output", str(output)])

    assert exit_code == 0
    assert output.read_text(encoding="utf-8") == render_openapi(build_app())
    assert b"\r\n" not in output.read_bytes()
    assert "openapi.json" in capsys.readouterr().out


def test_check_passes_for_fresh_file(tmp_path: Path) -> None:
    output = tmp_path / "openapi.json"
    main(["--output", str(output)])

    assert main(["--output", str(output), "--check"]) == 0


@pytest.mark.parametrize("stale", ["{}\n", None], ids=["changed", "missing"])
def test_check_fails_for_stale_file_and_does_not_write(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], stale: str | None
) -> None:
    output = tmp_path / "openapi.json"
    if stale is not None:
        output.write_text(stale, encoding="utf-8")

    exit_code = main(["--output", str(output), "--check"])

    assert exit_code == 1
    assert "pnpm gen:api" in capsys.readouterr().err
    assert (output.read_text(encoding="utf-8") if output.exists() else None) == stale


def test_export_ignores_env_file_and_environment(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Invalid values everywhere: the export must not need (or read) real credentials.
    env_file = tmp_path / ".env.dev"
    env_file.write_text("DATABASE_URL=not-a-dsn\n", encoding="utf-8")
    monkeypatch.setitem(Settings.model_config, "env_file", env_file)
    monkeypatch.setenv("DATABASE_URL", "not-a-dsn")

    assert json.loads(render_openapi(build_app()))["info"]["title"] == "Zakroma API"


def test_committed_schema_matches_the_app__NFR_MNT_04() -> None:
    """Drift check: an API change without `pnpm gen:api` (in frontend/) fails here."""
    assert DEFAULT_OUTPUT == REPO_ROOT / "frontend" / "src" / "api" / "openapi.json"
    committed = DEFAULT_OUTPUT.read_text(encoding="utf-8") if DEFAULT_OUTPUT.exists() else ""

    assert committed == render_openapi(build_app()), (
        "frontend/src/api/openapi.json is stale: run `pnpm gen:api` in frontend/"
    )
