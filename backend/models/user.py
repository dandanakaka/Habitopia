from pydantic import BaseModel, EmailStr
from typing import Optional

class UserProfile(BaseModel):
    uid: str
    email: EmailStr
    display_name: str
    # Integration handles for Module 5: Cron/Decay Engine [cite: 87]
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None
    current_realm_id: Optional[str] = None