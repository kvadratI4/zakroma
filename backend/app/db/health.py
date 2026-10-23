import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def ping(session: AsyncSession, *, timeout_seconds: float) -> None:
    """Round-trip to the database; TimeoutError if it does not answer in time."""
    async with asyncio.timeout(timeout_seconds):
        await session.execute(text("SELECT 1"))
