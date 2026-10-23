from typing import cast

from fastapi import Request

from app.core.clock import Clock


def get_clock(request: Request) -> Clock:
    return cast(Clock, request.app.state.clock)
