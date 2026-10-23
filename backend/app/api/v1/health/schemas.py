from typing import Literal

from pydantic import BaseModel


class HealthOut(BaseModel):
    # `db` is added together with the database in T-003.
    status: Literal["ok"]
