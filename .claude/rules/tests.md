---
paths:
  - "backend/tests/**"
  - "frontend/src/**/*.test.{ts,tsx}"
  - "frontend/e2e/**"
---

# Test rules

- Tests are written BEFORE the implementation and must be seen failing for the expected reason (see /task-implement).
- Name tests by behaviour, append the requirement id when there is one: `test_consume_more_than_left_clamps__FR_INV_05`.
- Domain test vectors live in `docs/05-domain-rules.md`; implement them as `pytest.mark.parametrize` tables, one row per vector, with ids.
- Fixed time: use the `clock` fixture (2026-11-10 12:00 Europe/Moscow), never real `now()`.
- Integration tests hit a real Postgres (testcontainers); no SQLite, no mocking the DB.
- External services are replaced by fakes implementing the port protocol; no network in the default test run.
- Each new household-scoped route must be added to the access matrix (401 without session, 404 for another household, 404 for foreign entity id).
- Do not weaken or delete an existing assertion to make a test pass without the operator's explicit OK.
- Bug fix = first a failing test that reproduces it.
- Helper routers/classes inside test modules must not be named `test_*`/`Test*` (use `probe_router`, `FakeX`): pytest tries to collect them (`PytestCollectionWarning`). (T-002)
