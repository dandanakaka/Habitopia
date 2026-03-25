from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Literal


class HabitLog(BaseModel):
    user_uid: str
    habit_id: str
    date: str  # YYYY-MM-DD format for daily tracking
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # "committed" triggers the XP update for the Village
    status: Literal["committed", "skipped"] = "committed"
    xp_value: int = 10
