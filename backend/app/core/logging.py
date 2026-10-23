"""Structured logs: one JSON object per line on stdout, stdlib loggers (uvicorn) included."""

import logging
import sys
from typing import TextIO

import structlog
from structlog.types import Processor

from app.core.config import Settings


class _StdoutHandler(logging.StreamHandler[TextIO]):
    """Writes to the *current* sys.stdout, so replaced streams (test capture) are honoured."""

    def emit(self, record: logging.LogRecord) -> None:
        self.stream = sys.stdout
        super().emit(record)


def configure_logging(settings: Settings) -> None:
    shared: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
    ]
    renderer: Processor
    if settings.log_format == "json":
        renderer = structlog.processors.JSONRenderer(ensure_ascii=False)
        final: list[Processor] = [structlog.processors.format_exc_info, renderer]
    else:
        final = [structlog.dev.ConsoleRenderer()]

    structlog.configure(
        processors=[*shared, structlog.stdlib.ProcessorFormatter.wrap_for_formatter],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=False,
    )
    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared,
        processors=[structlog.stdlib.ProcessorFormatter.remove_processors_meta, *final],
    )
    handler = _StdoutHandler()
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(settings.log_level)
    # uvicorn installs its own handlers; route everything through the root handler instead.
    for name in ("uvicorn", "uvicorn.error"):
        uvicorn_logger = logging.getLogger(name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.propagate = True
    # RequestContextMiddleware writes the access line (with request id and duration).
    logging.getLogger("uvicorn.access").disabled = True
    # httpx logs full URLs at INFO; query strings may carry tokens or API keys.
    for name in ("httpx", "httpcore"):
        logging.getLogger(name).setLevel(logging.WARNING)
