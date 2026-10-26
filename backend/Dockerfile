# syntax=docker/dockerfile:1
# api image (T-007): FastAPI under uvicorn; also runs migrations (compose service `migrate`).
# Base images are pinned by digest (a tag can be moved); Dependabot updates them.

FROM ghcr.io/astral-sh/uv:0.13.5@sha256:32a7bb39b496babbd997b0a39a4d66c126bdaf5661b302bf6f06abda8deca6ff AS uv

FROM python:3.13-slim@sha256:d98cc29d3266e535dd9da1099688d9cb3ca4753813571e071763d17725460962 AS build
COPY --from=uv /uv /bin/uv
# The image's own Python, no download; bytecode compiled at build time for a read-only runtime.
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
WORKDIR /app
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev --no-install-project
COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app

FROM python:3.13-slim@sha256:d98cc29d3266e535dd9da1099688d9cb3ca4753813571e071763d17725460962
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin zakroma
WORKDIR /app
COPY --from=build /app /app
ENV PATH="/app/.venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER 10001
EXPOSE 8000
# X-Forwarded-For is trusted only from the compose network `web` (Caddy), see docker-compose.yml.
CMD ["uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000", \
     "--proxy-headers", "--forwarded-allow-ips", "172.30.250.0/24", "--workers", "2"]
