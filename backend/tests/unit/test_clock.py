from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.core.clock import Clock, FixedClock, SystemClock

MOSCOW_NOON = datetime(2026, 11, 10, 12, 0, tzinfo=ZoneInfo("Europe/Moscow"))


def test_fixed_clock_returns_given_moment() -> None:
    clock: Clock = FixedClock(MOSCOW_NOON)

    assert clock.now() == MOSCOW_NOON


def test_fixed_clock_rejects_naive_datetime() -> None:
    with pytest.raises(ValueError, match="timezone"):
        FixedClock(datetime(2026, 11, 10, 12, 0))


def test_fixed_clock_advances() -> None:
    clock = FixedClock(MOSCOW_NOON)

    clock.advance(timedelta(days=1))

    assert clock.now() == MOSCOW_NOON + timedelta(days=1)


def test_system_clock_returns_aware_utc_now() -> None:
    clock: Clock = SystemClock()

    now = clock.now()

    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)
    assert abs(now - datetime.now(UTC)) < timedelta(seconds=5)
