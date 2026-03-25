# models/pulse.py
from pydantic import BaseModel
from typing import Literal


class Habit(BaseModel):
    habit_id: str
    title: str
    # Defines if the habit is manual or automated via GitHub/LeetCode
    type: Literal["manual", "github", "leetcode"]
    xp_value: int