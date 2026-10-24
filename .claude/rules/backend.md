---
paths:
  - "backend/**/*.py"
---

# Backend rules

- Layers: `api/v1` (thin: validate → call service → map to schema) → `services` (use cases, one transaction per mutating request, writes stock_events) → `domain` (pure) / `db` (models, queries) / `integrations` (ports as `typing.Protocol` + adapters).
- `app/domain` must not import fastapi, sqlalchemy, httpx, datetime.now/date.today. Pass `today: date` / `now: datetime` explicitly.
- Quantities and money: `Decimal` only. Pydantic fields `condecimal(max_digits=12, decimal_places=3)` or `Annotated[Decimal, …]`. Never `float`.
- Every household-scoped route uses the `require_member` dependency and receives `HouseholdContext`. Every query by entity id also filters by `household_id`. Register new routes in the access-check fixture registry (`tests/integration/test_access_matrix.py`).
- Mutations of versioned rows: `UPDATE … WHERE id = :id AND household_id = :hid AND version = :v RETURNING *`; no row → raise `VersionConflict(current=…)` → 409 problem+json.
- Errors: raise domain/app exceptions with a stable `code`; the global handler converts to `application/problem+json`. Do not raise `HTTPException` with free text from services.
- OpenAPI (ADR-0008, T-005): declare scenario errors on the route, `responses={409: problem_response("…")}` (`app/core/openapi.py`); `default` and `422` are added for every route. operationId = route function name, so route function names must be unique. After any API change run `pnpm gen:api` in frontend/ and commit `openapi.json` + `schema.d.ts` (a pytest test and the `openapi-fresh` hook fail otherwise).
- Time zone: household "today" = `now.astimezone(ZoneInfo(household.timezone)).date()`.
- Async SQLAlchemy 2.0 style (`select()`, `session.execute`), no legacy `Query`.
- Typing: `mypy --strict` clean; no `Any` in public signatures without a comment why.
- Logging: structlog, key-value, no personal data (emails, tokens) in logs.
- Log the request path without the query string; keep `httpx`/`httpcore` loggers at WARNING or above (at INFO they log full URLs, query included). The access line is written only by `RequestContextMiddleware`; uvicorn's access log is disabled in `configure_logging`, so `--no-access-log` is not needed. (T-002)
