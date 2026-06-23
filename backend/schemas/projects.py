from datetime import datetime
from typing import Optional

from pydantic import BaseModel, computed_field

from models import project
from models.project import ProjectStatus


class ProjectsCreate(BaseModel):
    title: str
    description: str = ""
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    status: ProjectStatus = ProjectStatus.DRAFT


class ProjectsUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    status: Optional[ProjectStatus] = None


class ProjectsRead(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    image_url: str = ""
    owner_id: int
    category_id: Optional[int]
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def full_image_url(self) -> str:
        if not self.image_url:
            return ""
        return f"/projects/uploads/{self.image_url}"


class ProjectUpdateStatus(BaseModel):
    status: ProjectStatus
