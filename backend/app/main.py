from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.router import API_V1_PREFIX
from app.api.v1.router import router as api_v1_router
from app.core.clock import Clock, SystemClock
from app.core.config import Settings
from app.core.errors import install_error_handlers
from app.core.logging import configure_logging
from app.core.middleware import RequestContextMiddleware
from app.core.openapi import install_problem_openapi, operation_id
from app.db.session import create_engine, create_sessionmaker


def create_app(settings: Settings | None = None, clock: Clock | None = None) -> FastAPI:
    """Build the application; run with `uvicorn app.main:create_app --factory`."""
    settings = settings or Settings()
    configure_logging(settings)
    engine = create_engine(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        yield
        await app.state.engine.dispose()

    app = FastAPI(
        title="Zakroma API",
        version="0.1.0",
        openapi_url=f"{API_V1_PREFIX}/openapi.json",
        docs_url=f"{API_V1_PREFIX}/docs" if settings.environment != "prod" else None,
        redoc_url=None,
        generate_unique_id_function=operation_id,
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.clock = clock or SystemClock()
    app.state.engine = engine
    app.state.sessionmaker = create_sessionmaker(engine)
    app.add_middleware(RequestContextMiddleware)
    install_error_handlers(app)
    install_problem_openapi(app)
    app.include_router(api_v1_router)
    return app
