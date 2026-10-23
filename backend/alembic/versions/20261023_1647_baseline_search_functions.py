"""baseline search functions

pg_trgm and the search-key functions, verbatim from docs/db/schema_design.sql.
Tables arrive with the tasks that introduce their models (T-010, T-011, T-020, T-031).

Revision ID: e8d27e16e5b3
Revises:
Create Date: 2026-10-23 16:47:38.178734+00:00
"""

from collections.abc import Sequence

from alembic import op

revision: str = "e8d27e16e5b3"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# Lower case, ё → е: plain comparison of names.
ZK_SEARCH_NORM = """
CREATE OR REPLACE FUNCTION zk_search_norm(t text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    RETURN lower(replace(replace(t, 'ё', 'е'), 'Ё', 'Е'))
"""

# Fuzzy search key: norm + folding of the vowels people confuse most (о→а, э→е, я→а, ы→и).
ZK_SEARCH_FOLD = """
CREATE OR REPLACE FUNCTION zk_search_fold(t text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    RETURN translate(zk_search_norm(t), 'оэяы', 'аеаи')
"""


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute(ZK_SEARCH_NORM)
    op.execute(ZK_SEARCH_FOLD)


def downgrade() -> None:
    # Forward-only migrations (CLAUDE.md, rule 9): fix mistakes with a new revision.
    raise NotImplementedError("downgrade is not supported")
