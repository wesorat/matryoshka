from pydantic import BaseModel



class CommentsCreate(BaseModel):
    text: str
    project_id: int

class CommentsRead(BaseModel):
    id: int
    text: str
    user_id: int
    project_id: int


