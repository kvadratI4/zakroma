import structlog
from fastapi import APIRouter
from sqlalchemy.exc import SQLAlchemyError

from app.api.deps import SessionDep
from app.api.v1.health.schemas import HealthOut
from app.core.errors import AppError
from app.core.openapi import problem_response
from app.db.health import ping

DB_CHECK_TIMEOUT_SECONDS = 5

router = APIRouter(tags=["service"])
logger = structlog.get_logger(__name__)


@router.get("/health", responses={503: problem_response("Database unavailable: db_unavailable")})
async def get_health(session: SessionDep) -> HealthOut:
    try:
        await ping(session, timeout_seconds=DB_CHECK_TIMEOUT_SECONDS)
    except (OSError, SQLAlchemyError, TimeoutError) as exc:
        # Only the exception class: driver messages may contain host and user names.
        logger.warning("db_unavailable", error=type(exc).__name__)
        raise AppError("db_unavailable", status=503, title="База данных недоступна") from None
    return HealthOut(status="ok", db="ok")
