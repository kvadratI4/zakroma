"""Database roles of the prod stack (T-007, AC-3): the api cannot change the schema.

Runs deploy/db-init/10-roles.sh, the same script the prod `db` service runs on a new volume, in
its own Postgres container.
"""

import asyncio
import secrets
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

import asyncpg
import pytest
from alembic import command
from testcontainers.community.postgres import PostgresContainer

from tests.conftest import POSTGRES_IMAGE
from tests.migrations.alembic_config import alembic_config

INIT_DIR = Path(__file__).resolve().parents[3] / "deploy" / "db-init"
DATABASE = "zakroma"


@dataclass(frozen=True)
class Cluster:
    host: str
    port: int
    superuser_password: str
    owner_password: str
    app_password: str

    def dsn(self, user: str, password: str, database: str = DATABASE) -> str:
        return f"postgresql://{user}:{password}@{self.host}:{self.port}/{database}"

    @property
    def owner(self) -> str:
        return self.dsn("zakroma_owner", self.owner_password)

    @property
    def app(self) -> str:
        return self.dsn("zakroma_app", self.app_password)


@pytest.fixture(scope="module")
def cluster() -> Iterator[Cluster]:
    if not (INIT_DIR / "10-roles.sh").is_file():
        pytest.fail(f"{INIT_DIR / '10-roles.sh'} is missing")
    passwords = [secrets.token_urlsafe(24) for _ in range(3)]
    container = (
        PostgresContainer(POSTGRES_IMAGE, username="postgres", password=passwords[0])
        .with_env("ZAKROMA_OWNER_PASSWORD", passwords[1])
        .with_env("ZAKROMA_APP_PASSWORD", passwords[2])
        .with_volume_mapping(str(INIT_DIR), "/docker-entrypoint-initdb.d", "ro")
    )
    container.ports["5432"] = ("127.0.0.1", None)  # type: ignore[assignment]  # loopback only
    with container:
        port = int(container.get_exposed_port(5432))
        yield Cluster("127.0.0.1", port, *passwords)


def fetch(dsn: str, query: str) -> list[asyncpg.Record]:
    async def run() -> list[asyncpg.Record]:
        connection = await asyncpg.connect(dsn)
        try:
            return await connection.fetch(query)
        finally:
            await connection.close()

    return asyncio.run(run())


def test_owner_runs_migrations(cluster: Cluster) -> None:
    config = alembic_config(cluster.owner.replace("postgresql://", "postgresql+asyncpg://"))
    config.attributes["skip_logging_config"] = True

    command.upgrade(config, "head")

    assert fetch(cluster.app, "SELECT zk_search_fold('Молоко') AS folded")[0]["folded"]


def test_app_reads_and_writes_tables_the_owner_creates(cluster: Cluster) -> None:
    fetch(cluster.owner, "CREATE TABLE probe (id serial PRIMARY KEY, name text NOT NULL)")

    fetch(cluster.app, "INSERT INTO probe (name) VALUES ('молоко')")
    fetch(cluster.app, "UPDATE probe SET name = 'сыр'")
    rows = fetch(cluster.app, "SELECT name FROM probe")
    fetch(cluster.app, "DELETE FROM probe")

    assert [row["name"] for row in rows] == ["сыр"]


@pytest.mark.parametrize(
    "statement",
    [
        "CREATE TABLE evil (id int)",
        "DROP TABLE alembic_version",
        "ALTER TABLE alembic_version ADD COLUMN evil int",
        "CREATE ROLE evil",
        "CREATE EXTENSION IF NOT EXISTS pgcrypto",
    ],
    ids=["create_table", "drop_table", "alter_table", "create_role", "create_extension"],
)
def test_app_cannot_change_the_schema(cluster: Cluster, statement: str) -> None:
    with pytest.raises(asyncpg.InsufficientPrivilegeError):
        fetch(cluster.app, statement)


def test_app_cannot_connect_to_the_postgres_database(cluster: Cluster) -> None:
    with pytest.raises(asyncpg.InsufficientPrivilegeError):
        fetch(cluster.dsn("zakroma_app", cluster.app_password, "postgres"), "SELECT 1")


def test_owner_and_app_are_not_superusers(cluster: Cluster) -> None:
    rows = fetch(
        cluster.dsn("postgres", cluster.superuser_password, "postgres"),
        "SELECT rolname, rolsuper, rolcreatedb, rolcreaterole FROM pg_roles "
        "WHERE rolname LIKE 'zakroma%' ORDER BY rolname",
    )

    assert [tuple(row) for row in rows] == [
        ("zakroma_app", False, False, False),
        ("zakroma_owner", False, False, False),
    ]
