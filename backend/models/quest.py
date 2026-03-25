from pydantic import BaseModel
from datetime import datetime
from typing import Literal

class SideQuest(BaseModel):
    quest_id: str
    assigner_uid: str
    target_uid: str
    title: str
    xp_reward: int
    status: Literal["pending", "accepted", "completed", "failed"] = "pending"
    created_at: datetime = datetime.utcnow()