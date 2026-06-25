from pydantic import BaseModel

from models.media import MediaView


class MediaCreate(BaseModel):
    view: MediaView = MediaView.IMAGE
    project_id: int


class MediaRead(BaseModel):
    id: int
    filename: str
    view: MediaView
    project_id: int
