"""Secrets for the prod stack, generated where it runs (T-007, AC-4; L-018)."""

import os
import re
import stat
from pathlib import Path

import pytest

from scripts.init_prod_env import DEFAULT_PATH, PASSWORD_VARS, main, write_prod_env

ENV_EXAMPLE = Path(__file__).resolve().parents[3] / "deploy" / ".env.example"


def read_env(path: Path) -> dict[str, str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    return dict(line.split("=", 1) for line in lines if line and not line.startswith("#"))


def test_passwords_are_random_distinct_and_url_safe(tmp_path: Path) -> None:
    path = tmp_path / ".env"

    assert write_prod_env(path, "zakroma.example.ru") is True

    env = read_env(path)
    passwords = [env[name] for name in PASSWORD_VARS]
    assert len(set(passwords)) == 3
    for password in passwords:
        assert len(password) >= 32
        assert re.fullmatch(r"[A-Za-z0-9_-]+", password)  # no escaping in DSNs and compose


def test_domain_uses_default_public_ports(tmp_path: Path) -> None:
    path = tmp_path / ".env"
    write_prod_env(path, "zakroma.example.ru")

    env = read_env(path)

    assert env["SITE_ADDRESS"] == "zakroma.example.ru"
    assert "HTTP_BIND" not in env
    assert "HTTPS_BIND" not in env


def test_local_run_listens_on_loopback_only(tmp_path: Path) -> None:
    path = tmp_path / ".env"
    write_prod_env(path, "127.0.0.1")

    env = read_env(path)

    assert env["SITE_ADDRESS"] == "127.0.0.1"
    assert env["HTTP_BIND"] == "127.0.0.1:8080"
    assert env["HTTPS_BIND"] == "127.0.0.1:8443"


@pytest.mark.parametrize(
    "site_address",
    ["", "zakroma.example.ru\nPOSTGRES_PASSWORD=x", "https://zakroma.ru", "a b", "-flag", "x:443"],
    ids=["empty", "newline", "scheme", "space", "dash", "port"],
)
def test_invalid_site_address_is_rejected_without_a_file(tmp_path: Path, site_address: str) -> None:
    path = tmp_path / ".env"

    with pytest.raises(ValueError, match="site address"):
        write_prod_env(path, site_address)

    assert not path.exists()


def test_existing_file_is_not_overwritten(tmp_path: Path) -> None:
    path = tmp_path / ".env"
    write_prod_env(path, "127.0.0.1")
    before = path.read_text(encoding="utf-8")

    assert write_prod_env(path, "zakroma.example.ru") is False
    assert path.read_text(encoding="utf-8") == before


@pytest.mark.skipif(os.name == "nt", reason="POSIX permissions; checked on Linux in CI")
def test_file_is_readable_by_owner_only(tmp_path: Path) -> None:
    path = tmp_path / ".env"
    write_prod_env(path, "127.0.0.1")

    assert stat.S_IMODE(path.stat().st_mode) == 0o600


def test_main_never_prints_passwords(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    path = tmp_path / ".env"

    assert main(["--site-address", "127.0.0.1", "--output", str(path)]) == 0
    assert main(["--site-address", "127.0.0.1", "--output", str(path)]) == 0

    env = read_env(path)
    output = capsys.readouterr()
    for name in PASSWORD_VARS:
        assert env[name] not in output.out + output.err
    assert str(path) in output.out


def test_main_reports_invalid_site_address(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    assert main(["--site-address", "a b", "--output", str(tmp_path / ".env")]) == 2
    assert "site address" in capsys.readouterr().err


def test_generated_file_has_every_variable_of_env_example(tmp_path: Path) -> None:
    path = tmp_path / ".env"
    write_prod_env(path, "127.0.0.1")

    example = read_env(ENV_EXAMPLE)

    assert set(example) == set(read_env(path))
    assert all(value == "" for value in example.values())  # the example carries no secrets


def test_default_path_is_deploy_env() -> None:
    assert DEFAULT_PATH.parts[-2:] == ("deploy", ".env")
