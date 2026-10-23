from typing import Annotated

import httpx
import pytest
from fastapi import APIRouter, Depends, FastAPI
from pydantic import SecretStr
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from testcontainers.community.postgres import PostgresContainer

from app.api.deps import SessionDep, get_clock
from app.core.clock import Clock
from app.core.config import Settings
from app.main import create_app
from tests.http import serve

probe_router = APIRouter(prefix="/api/v1/_test")


@probe_router.get("/database")
async def current_database(session: SessionDep) -> dict[str, str | None]:
    name = await session.scalar(text("SELECT current_database()"))
    return {"database": name}


@probe_router.get("/now")
async def now(clock: Annotated[Clock, Depends(get_clock)]) -> dict[str, str]:
    return {"now": clock.now().isoformat()}


@pytest.fixture
def app(app: FastAPI) -> FastAPI:
    app.include_router(probe_router)
    return app


async def test_session_dependency_talks_to_the_test_database(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/_test/database")

    assert response.json() == {"database": "zakroma_test"}


async def test_real_session_dependency_without_override(settings: Settings) -> None:
    app = create_app(settings)
    app.include_router(probe_router)
    async with serve(app) as client:
        response = await client.get("/api/v1/_test/database")

    assert response.json() == {"database": "zakroma_test"}


async def test_commit_inside_test_is_rolled_back_afterwards(
    db_session: AsyncSession, database_url: str
) -> None:
    await db_session.execute(text("CREATE TABLE probe_isolation (id int)"))
    await db_session.execute(text("INSERT INTO probe_isolation VALUES (1)"))
    await db_session.commit()  # as application code would do

    # The test's own session still sees its data after commit...
    assert await db_session.scalar(text("SELECT count(*) FROM probe_isolation")) == 1
    # ...but nothing reached the database for other connections.
    engine = create_async_engine(database_url)
    async with engine.connect() as other:
        visible = await other.scalar(text("SELECT to_regclass('probe_isolation')"))
    await engine.dispose()
    assert visible is None


async def test_app_starts_and_stops_without_database(settings: Settings) -> None:
    unreachable = "postgresql+asyncpg://zakroma:x@127.0.0.1:1/zakroma"
    app = create_app(settings.model_copy(update={"database_url": SecretStr(unreachable)}))

    async with app.router.lifespan_context(app):
        pass  # the pool is lazy: no connection attempt at startup


async def test_pool_is_closed_on_shutdown(settings: Settings) -> None:
    app = create_app(settings)

    async with app.router.lifespan_context(app):
        async with app.state.engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        assert app.state.engine.pool.checkedin() == 1

    assert app.state.engine.pool.checkedin() == 0


async def test_clock_fixture_is_the_domain_test_vectors_now(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/_test/now")

    assert response.json() == {"now": "2026-11-10T12:00:00+03:00"}


def test_test_database_container_listens_on_loopback_only(postgres: PostgresContainer) -> None:
    container = postgres.get_wrapped_container()
    container.reload()

    bindings = container.attrs["NetworkSettings"]["Ports"]["5432/tcp"]

    assert bindings
    assert {binding["HostIp"] for binding in bindings} == {"127.0.0.1"}
