from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import Settings

# Fail fast when the database is down instead of hanging the request (health, deploy checks).
CONNECT_TIMEOUT_SECONDS = 3


def create_engine(settings: Settings) -> AsyncEngine:
    """Engine with a lazy pool: nothing connects until the first query."""
    return create_async_engine(
        settings.database_url.get_secret_value(),
        pool_pre_ping=True,
        connect_args={"timeout": CONNECT_TIMEOUT_SECONDS},
    )


def create_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)
