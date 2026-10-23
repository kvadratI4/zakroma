import asyncio

import structlog
from fastapi import APIRouter
from sqlalchemy.exc import SQLAlchemyError

from app.api.deps import SessionDep
from app.api.v1.health.schemas import HealthOut
from app.core.errors import AppError
from app.db.health import ping

DB_CHECK_TIMEOUT_SECONDS = 5

router = APIRouter(tags=["service"])
logger = structlog.get_logger(__name__)


@router.get("/health")
async def get_health(session: SessionDep) -> HealthOut:
    try:
        async with asyncio.timeout(DB_CHECK_TIMEOUT_SECONDS):
            await ping(session)
    except (OSError, SQLAlchemyError, TimeoutError) as exc:
        # Only the exception class: driver messages may contain host and user names.
        logger.warning("db_unavailable", error=type(exc).__name__)
        raise AppError("db_unavailable", status=503, title="База данных недоступна") from None
    return HealthOut(status="ok", db="ok")
