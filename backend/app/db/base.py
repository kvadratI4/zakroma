from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# Postgres' own default names, so DDL from docs/db/schema_design.sql and the models agree
# (no false diffs in `alembic check`). CHECK constraints must always be named explicitly.
NAMING_CONVENTION: dict[str, str] = {
    "pk": "%(table_name)s_pkey",
    "uq": "%(table_name)s_%(column_0_N_name)s_key",
    "fk": "%(table_name)s_%(column_0_N_name)s_fkey",
    "ix": "%(table_name)s_%(column_0_N_name)s_idx",
    "ck": "%(constraint_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
