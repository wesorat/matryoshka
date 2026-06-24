from pydantic import BaseModel

from schemas.user import UserRead, UserReadMain
from datetime import datetime



class CommentsCreate(BaseModel):
    text: str
    project_id: int

class CommentsRead(BaseModel):
    id: int
    text: str
    user: UserReadMain
    project_id: int
    created_at: datetime


