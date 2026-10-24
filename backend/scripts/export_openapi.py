"""Export the API schema to frontend/src/api/openapi.json (ADR-0008).

Run from frontend/ as part of type generation:  pnpm gen:api
Directly:  uv run python -m scripts.export_openapi [--check] [--output PATH]
No database and no deploy/.env.dev are needed; `--check` only compares and exits 1 if stale.
"""

import argparse
import json
import sys
from pathlib import Path

from fastapi import FastAPI
from pydantic import SecretStr

from app.core.config import Settings
from app.main import create_app

DEFAULT_OUTPUT = Path(__file__).resolve().parents[2] / "frontend" / "src" / "api" / "openapi.json"
# The schema does not depend on the database; the engine is lazy and never connects.
EXPORT_DATABASE_URL = "postgresql+asyncpg://openapi-export@127.0.0.1:1/openapi-export"


def build_app() -> FastAPI:
    """The application as served, built without deploy/.env.dev or a database."""
    settings = Settings(
        environment="test", database_url=SecretStr(EXPORT_DATABASE_URL), _env_file=None
    )
    return create_app(settings)


def render_openapi(app: FastAPI) -> str:
    """Stable text: sorted keys and readable Cyrillic keep diffs small."""
    return json.dumps(app.openapi(), ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Export the API schema for the frontend.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true", help="exit 1 if the file is stale")
    args = parser.parse_args(argv)
    output: Path = args.output
    schema = render_openapi(build_app())

    if args.check:
        current = output.read_text(encoding="utf-8") if output.exists() else None
        if current != schema:
            print(f"{output} is stale: run `pnpm gen:api` in frontend/", file=sys.stderr)
            return 1
        print(f"{output} is up to date")
        return 0

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(schema, encoding="utf-8", newline="\n")
    print(f"Wrote {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
