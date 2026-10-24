"""Shared fixtures. Test database isolation: docs/adr/0011-test-db-isolation.md."""

import secrets
from collections.abc import AsyncIterator, Iterator
from datetime import datetime
from zoneinfo import ZoneInfo

import httpx
import pytest
from alembic import command
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool
from testcontainers.community.postgres import PostgresContainer
from testcontainers.core.config import testcontainers_config

from app.api.deps import get_session
from app.core.clock import FixedClock
from app.core.config import Settings
from app.main import create_app
from tests.http import serve
from tests.migrations.alembic_config import alembic_config

POSTGRES_IMAGE = "postgres:18"
# Fixed "now" of the domain test vectors (docs/05-domain-rules.md).
TEST_NOW = datetime(2026, 11, 10, 12, 0, tzinfo=ZoneInfo("Europe/Moscow"))

# Ryuk (the testcontainers reaper) publishes its port on all interfaces; the database
# container is stopped by the fixture instead.
testcontainers_config.ryuk_disabled = True


@pytest.fixture(scope="session", autouse=True)
def no_dev_env_file() -> Iterator[None]:
    """Tests never read deploy/.env.dev: it holds the local database password and CI has no
    such file, so a test relying on it passes only on the developer's machine (L-033)."""
    with pytest.MonkeyPatch.context() as patch:
        patch.setitem(Settings.model_config, "env_file", None)
        yield


@pytest.fixture(scope="session")
def postgres() -> Iterator[PostgresContainer]:
    container = PostgresContainer(
        POSTGRES_IMAGE,
        username="zakroma",
        password=secrets.token_urlsafe(24),
        dbname="zakroma_test",
        driver="asyncpg",
    )
    # Loopback only: the test database must not be reachable from the network.
    # docker-py accepts (host_ip, host_port); testcontainers only types the port as int.
    container.ports["5432"] = ("127.0.0.1", None)  # type: ignore[assignment]
    with container:
        yield container


@pytest.fixture(scope="session")
def database_url(postgres: PostgresContainer) -> str:
    """Shared test database, migrated to head once per run."""
    url = postgres.get_connection_url(host="127.0.0.1")
    config = alembic_config(url)
    config.attributes["skip_logging_config"] = True  # keep the app's structlog setup
    command.upgrade(config, "head")
    return url


@pytest.fixture
def clock() -> FixedClock:
    return FixedClock(TEST_NOW)


@pytest.fixture
def settings(database_url: str) -> Settings:
    return Settings(
        environment="test",
        log_level="INFO",
        log_format="json",
        database_url=database_url,
        _env_file=None,
    )


@pytest.fixture
async def db_connection(database_url: str) -> AsyncIterator[AsyncConnection]:
    """Connection inside an outer transaction that is rolled back after the test."""
    engine = create_async_engine(database_url, poolclass=NullPool)
    async with engine.connect() as connection:
        transaction = await connection.begin()
        try:
            yield connection
        finally:
            await transaction.rollback()
    await engine.dispose()


@pytest.fixture
async def db_session(db_connection: AsyncConnection) -> AsyncIterator[AsyncSession]:
    # commit() in application code releases a SAVEPOINT; the outer transaction still rolls back.
    async with AsyncSession(
        bind=db_connection, join_transaction_mode="create_savepoint", expire_on_commit=False
    ) as session:
        yield session


@pytest.fixture
def app(settings: Settings, clock: FixedClock, db_session: AsyncSession) -> FastAPI:
    """App bound to the test transaction; extend it in a module with `def app(app)`."""
    app = create_app(settings, clock=clock)

    async def test_session() -> AsyncIterator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_session] = test_session
    return app


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[httpx.AsyncClient]:
    async with serve(app) as client:
        yield client
