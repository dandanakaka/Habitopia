from pydantic import BaseModel, Field
from typing import List

class Realm(BaseModel):
    realm_id: str
    name: str
    creator_uid: str
    # Members list is hard-capped at 5 
    members: List[str] = Field(..., max_items=5) 
    health: int = Field(default=100, ge=0, le=100)
    total_xp: int = 0
    status: str = "active"  # active, decayed, or archived