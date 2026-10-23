---
paths:
  - "backend/alembic/**"
  - "backend/app/db/**"
  - "docs/db/**"
  - "docs/catalog/**"
---

# Database rules

- `docs/db/schema.sql` is the design reference until the first migration exists; after that Alembic migrations are the source of truth and `schema.sql` is regenerated (`pg_dump --schema-only --no-owner`) in the same task.
- Never edit a migration that may have been applied anywhere (merged to main). Write a new one.
- Revision names `YYYYMMDD_HHMM_<what>`. Data migrations (catalog load) separate from schema migrations.
- Expand → contract for renames/drops: add new column, backfill, switch code, drop in a later release.
- Enumerations are `text` + `CHECK`, not PG enums. Levels are `smallint 0..5`.
- Cross-household integrity uses composite FKs `(household_id, x_id)` — keep this pattern for every new household-scoped table.
- `stock_events` is append-only (triggers block UPDATE/DELETE). Test cleanup must use `TRUNCATE … CASCADE` or transaction rollback, never `DELETE FROM stock_events`.
- Search keys use `zk_search_fold()`; fuzzy match with `word_similarity` / `<%`, not `similarity` / `%`.
- Catalog CSV: after editing run `python3 docs/catalog/validate_catalog.py`; never rename an existing `slug`.
