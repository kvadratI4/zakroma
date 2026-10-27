"""Checks of a running prod stack through Caddy (T-007, AC-1, AC-2, AC-5..AC-8).

Skipped unless ZAKROMA_SMOKE_URL is set. After `docker compose up` (docs/09-deployment.md §2.4):
    ZAKROMA_SMOKE_URL=https://127.0.0.1:8443      the site, verified with Caddy's local root CA
    ZAKROMA_SMOKE_CA=<path to root.crt>           copied from the caddy_data volume
    ZAKROMA_SMOKE_HTTP_URL=http://127.0.0.1:8080  optional: HTTP must redirect to HTTPS
    ZAKROMA_SMOKE_COMPOSE_FILE=../deploy/docker-compose.yml  optional: container checks
    uv run pytest tests/smoke
"""

import json
import os
import re
import ssl
import subprocess
from collections.abc import Iterator

import httpx
import pytest

BASE_URL = os.environ.get("ZAKROMA_SMOKE_URL", "")
CA_FILE = os.environ.get("ZAKROMA_SMOKE_CA", "")
HTTP_URL = os.environ.get("ZAKROMA_SMOKE_HTTP_URL", "")
COMPOSE_FILE = os.environ.get("ZAKROMA_SMOKE_COMPOSE_FILE", "")

pytestmark = pytest.mark.skipif(not BASE_URL, reason="no running prod stack (ZAKROMA_SMOKE_URL)")

UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
PROBLEM_JSON = "application/problem+json"


@pytest.fixture(scope="module")
def client() -> Iterator[httpx.Client]:
    # TLS is verified against the CA that signed the certificate, never switched off.
    verify = ssl.create_default_context(cafile=CA_FILE) if CA_FILE else True
    with httpx.Client(base_url=BASE_URL, verify=verify, timeout=10) as client:
        yield client


def csp(response: httpx.Response) -> dict[str, str]:
    directives = response.headers["content-security-policy"].split(";")
    return dict(d.strip().split(" ", 1) for d in directives if d.strip())


# --- API through Caddy


def test_health_is_served_through_caddy(client: httpx.Client) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": "ok"}
    assert UUID.fullmatch(response.headers["x-request-id"])


def test_caddy_replaces_a_client_request_id(client: httpx.Client) -> None:
    response = client.get("/api/v1/health", headers={"X-Request-ID": "chosen-by-client"})

    assert response.headers["x-request-id"] != "chosen-by-client"
    assert UUID.fullmatch(response.headers["x-request-id"])


def test_large_api_bodies_are_refused_by_caddy(client: httpx.Client) -> None:
    # API bodies are small JSON; a 2 MB body never reaches the api (limit 1 MB in the Caddyfile).
    response = client.post("/api/v1/health", content=b"x" * 2_000_000)

    assert response.status_code == 413
    assert response.headers["content-type"] == PROBLEM_JSON
    assert response.json()["code"] == "payload_too_large"
    assert client.post("/api/v1/health", content=b"x" * 999_999).status_code == 405  # reaches api


@pytest.mark.parametrize("path", ["/api/v1/openapi.json", "/api/v1/docs"])
def test_schema_and_docs_are_not_published(client: httpx.Client, path: str) -> None:
    response = client.get(path)

    assert response.status_code == 404
    assert response.headers["content-type"] == PROBLEM_JSON


# --- SPA


def test_deep_link_serves_the_spa_without_caching(client: httpx.Client) -> None:
    response = client.get("/shopping")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert '<div id="root">' in response.text
    assert response.headers["cache-control"] == "no-cache"  # a new release is picked up at once


def test_dev_showcase_is_not_shipped(client: httpx.Client) -> None:
    """The component showcase /dev/ui exists only in the dev build (T-008b, AC-5)."""
    scripts = re.findall(r'src="(/assets/[^"]+\.js)"', client.get("/dev/ui").text)
    assert scripts

    for src in scripts:
        assert "zakroma-dev-showcase" not in client.get(src).text


def test_theme_is_applied_before_the_app(client: httpx.Client) -> None:
    """T-009, AC-4, AC-6: a chosen theme is set by a same-origin script that comes first in <head>,
    before the stylesheet and the app, so the CSP stays `script-src 'self'`."""
    first = re.search(r"<head>\s*(<script\b[^>]*>)", client.get("/").text)
    assert first is not None
    boot = re.fullmatch(r'<script src="(/assets/theme-boot-[0-9a-f]{8}\.js)">', first.group(1))
    assert boot is not None, first.group(1)

    response = client.get(boot.group(1))

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/javascript")
    assert response.headers["cache-control"] == "public, max-age=31536000, immutable"
    assert "zakroma.theme" in response.text


def test_hashed_assets_are_cached_and_compressed(client: httpx.Client) -> None:
    # The app bundle, not the first script: the theme boot script comes first (T-009) and, at
    # ~130 bytes, is below Caddy's 512-byte compression threshold (operator, 2026-10-28).
    script = re.search(r'<script type="module"[^>]*src="(/assets/[^"]+\.js)"', client.get("/").text)
    assert script is not None

    response = client.get(script.group(1), headers={"Accept-Encoding": "zstd, gzip"})

    assert response.status_code == 200
    assert response.headers["cache-control"] == "public, max-age=31536000, immutable"
    assert response.headers["content-encoding"] in {"zstd", "gzip"}


# --- Security headers


@pytest.mark.parametrize("path", ["/", "/api/v1/health"])
def test_security_headers(client: httpx.Client, path: str) -> None:
    headers = client.get(path).headers

    assert headers["strict-transport-security"] == "max-age=31536000"
    assert headers["x-content-type-options"] == "nosniff"
    assert headers["referrer-policy"] == "same-origin"
    assert "camera=()" in headers["permissions-policy"]
    assert "server" not in headers


def test_content_security_policy_is_strict(client: httpx.Client) -> None:
    response = client.get("/")
    policy = csp(response)

    assert "unsafe-inline" not in response.headers["content-security-policy"]
    assert "unsafe-eval" not in response.headers["content-security-policy"]
    assert policy["default-src"] == "'self'"
    assert policy["script-src"] == "'self'"
    assert policy["style-src"] == "'self'"
    assert policy["connect-src"] == "'self'"
    assert policy["object-src"] == "'none'"
    assert policy["base-uri"] == "'none'"
    assert policy["frame-ancestors"] == "'none'"


@pytest.mark.skipif(not HTTP_URL, reason="ZAKROMA_SMOKE_HTTP_URL not set")
def test_http_redirects_to_https() -> None:
    response = httpx.get(HTTP_URL + "/shopping", follow_redirects=False, timeout=10)

    assert response.status_code in {301, 308}
    assert response.headers["location"].startswith("https://")


# --- Containers


def compose(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(  # noqa: S603 - fixed docker command, no user input
        ["docker", "compose", "-f", COMPOSE_FILE, *args],  # noqa: S607
        capture_output=True,
        text=True,
        check=False,
    )


needs_compose = pytest.mark.skipif(not COMPOSE_FILE, reason="ZAKROMA_SMOKE_COMPOSE_FILE not set")


@needs_compose
@pytest.mark.parametrize(("service", "port"), [("db", "5432"), ("api", "8000")])
def test_only_caddy_publishes_ports(service: str, port: str) -> None:
    published = compose("port", service, port)

    assert published.stdout.strip() in {"", ":0"}


@needs_compose
@pytest.mark.parametrize("service", ["api", "caddy"])
def test_services_cannot_write_their_filesystem(service: str) -> None:
    result = compose("exec", "-T", service, "touch", "/srv-or-app-write-probe")

    assert result.returncode != 0
    assert "Read-only file system" in result.stderr or "Permission denied" in result.stderr


@needs_compose
def test_api_runs_as_an_unprivileged_user() -> None:
    result = compose("exec", "-T", "api", "id", "-u")

    assert result.stdout.strip() == "10001"


@needs_compose
@pytest.mark.parametrize("image", ["zakroma-api", "zakroma-caddy"])
def test_images_carry_no_secrets(image: str) -> None:
    # `config --images` prints image names only; plain `config` would print the secrets.
    assert image in compose("config", "--images").stdout.split()
    inspect = subprocess.run(  # noqa: S603
        ["docker", "image", "inspect", image],  # noqa: S607
        capture_output=True,
        text=True,
        check=True,
    )
    env = json.loads(inspect.stdout)[0]["Config"]["Env"]

    assert not [name for name in env if "PASSWORD" in name or "DATABASE_URL" in name]
