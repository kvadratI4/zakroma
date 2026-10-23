from fastapi import APIRouter

from app.api.v1.health.schemas import HealthOut

router = APIRouter(tags=["service"])


@router.get("/health")
async def get_health() -> HealthOut:
    return HealthOut(status="ok")
