import pytest
from sqlalchemy import CheckConstraint, Column, ForeignKey, Index, Integer, MetaData, Table, Text
from sqlalchemy.dialects.postgresql.base import PGDialect
from sqlalchemy.exc import InvalidRequestError
from sqlalchemy.schema import CreateIndex, CreateTable

from app.db.base import NAMING_CONVENTION, Base


def ddl(statement: CreateTable | CreateIndex) -> str:
    return str(statement.compile(dialect=PGDialect()))  # type: ignore[no-untyped-call]  # untyped in SQLAlchemy


def test_constraint_names_match_postgres_defaults() -> None:
    # Same names as Postgres generates for unnamed constraints in docs/db/schema_design.sql.
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
    Table("parents", metadata, Column("id", Integer, primary_key=True))
    children = Table(
        "children",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("parent_id", ForeignKey("parents.id")),
        Column("name", Text, unique=True),
        CheckConstraint("id > 0", name="children_id_positive"),
    )
    index = Index(None, children.c.parent_id, children.c.name)

    table_ddl = ddl(CreateTable(children))

    assert "CONSTRAINT children_pkey PRIMARY KEY" in table_ddl
    assert "CONSTRAINT children_name_key UNIQUE" in table_ddl
    assert "CONSTRAINT children_parent_id_fkey FOREIGN KEY" in table_ddl
    assert "CONSTRAINT children_id_positive CHECK" in table_ddl
    assert ddl(CreateIndex(index)).startswith("CREATE INDEX children_parent_id_name_idx")


def test_check_constraints_must_be_named_explicitly() -> None:
    metadata = MetaData(naming_convention=NAMING_CONVENTION)

    with pytest.raises(InvalidRequestError, match="explicitly named"):
        Table("t", metadata, Column("id", Integer), CheckConstraint("id > 0"))


def test_models_share_the_conventional_metadata() -> None:
    assert Base.metadata.naming_convention == {"ix": "ix_%(column_0_label)s", **NAMING_CONVENTION}
