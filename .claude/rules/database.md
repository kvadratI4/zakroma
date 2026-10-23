---
paths:
  - "backend/alembic/**"
  - "backend/app/db/**"
  - "docs/db/**"
  - "docs/catalog/**"
---

# Database rules

- Alembic migrations are the source of truth. `docs/db/schema.sql` is a dump of the migrated dev database (`pg_dump --schema-only --no-owner`, command in its header), regenerated in the task that changes the schema. `docs/db/schema_design.sql` is the design of the whole MVP schema: tables move from it into migrations with the task that adds their models; never delete or rewrite it without the operator's OK. (T-003)
- Constraint names follow `app/db/base.py` `NAMING_CONVENTION` (Postgres defaults); every `CHECK` needs an explicit name.
- Never edit a migration that may have been applied anywhere (merged to main). Write a new one.
- Revision names `YYYYMMDD_HHMM_<what>`. Data migrations (catalog load) separate from schema migrations.
- Expand → contract for renames/drops: add new column, backfill, switch code, drop in a later release.
- Enumerations are `text` + `CHECK`, not PG enums. Levels are `smallint 0..5`.
- Cross-household integrity uses composite FKs `(household_id, x_id)` — keep this pattern for every new household-scoped table.
- `stock_events` is append-only (triggers block UPDATE/DELETE). Test cleanup must use `TRUNCATE … CASCADE` or transaction rollback, never `DELETE FROM stock_events`.
- Search keys use `zk_search_fold()`; fuzzy match with `word_similarity` / `<%`, not `similarity` / `%`.
- Catalog CSV: after editing run `python3 docs/catalog/validate_catalog.py`; never rename an existing `slug`.
