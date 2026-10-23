from collections.abc import AsyncIterator
from typing import Annotated, cast

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.clock import Clock


def get_clock(request: Request) -> Clock:
    return cast(Clock, request.app.state.clock)


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    """One session per request; services open the transaction explicitly."""
    sessionmaker = cast(async_sessionmaker[AsyncSession], request.app.state.sessionmaker)
    async with sessionmaker() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]
