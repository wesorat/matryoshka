from pydantic import BaseModel


class LikesBase(BaseModel):
    project_id: int
