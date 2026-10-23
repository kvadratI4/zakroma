import re
from pathlib import Path

import pytest

from scripts.init_dev_env import DEFAULT_PATH, main, write_dev_env


def read_env(path: Path) -> dict[str, str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    return dict(line.split("=", 1) for line in lines if line and not line.startswith("#"))


def test_creates_env_with_random_password_and_matching_url(tmp_path: Path) -> None:
    path = tmp_path / ".env.dev"

    created = write_dev_env(path)

    env = read_env(path)
    assert created is True
    assert env["POSTGRES_USER"] == "zakroma"
    assert env["POSTGRES_DB"] == "zakroma"
    password = env["POSTGRES_PASSWORD"]
    assert len(password) >= 32
    assert re.fullmatch(r"[A-Za-z0-9_-]+", password)  # URL-safe: no escaping in the DSN
    assert env["DATABASE_URL"] == (
        f"postgresql+asyncpg://zakroma:{password}@127.0.0.1:5432/zakroma"
    )


def test_passwords_differ_between_files(tmp_path: Path) -> None:
    write_dev_env(tmp_path / "a.env")
    write_dev_env(tmp_path / "b.env")

    first = read_env(tmp_path / "a.env")["POSTGRES_PASSWORD"]
    second = read_env(tmp_path / "b.env")["POSTGRES_PASSWORD"]
    assert first != second


def test_existing_file_is_not_overwritten(tmp_path: Path) -> None:
    path = tmp_path / ".env.dev"
    write_dev_env(path)
    before = path.read_text(encoding="utf-8")

    created = write_dev_env(path)

    assert created is False
    assert path.read_text(encoding="utf-8") == before


def test_main_never_prints_the_password(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    path = tmp_path / ".env.dev"
    monkeypatch.setattr("scripts.init_dev_env.DEFAULT_PATH", path)

    main()
    main()

    password = read_env(path)["POSTGRES_PASSWORD"]
    output = capsys.readouterr()
    assert password not in output.out + output.err
    assert str(path) in output.out


def test_default_path_is_deploy_env_dev() -> None:
    assert DEFAULT_PATH.parts[-2:] == ("deploy", ".env.dev")
