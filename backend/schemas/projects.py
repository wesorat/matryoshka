from datetime import datetime
from typing import Optional

from pydantic import BaseModel, computed_field

from models.project import ProjectStatus
from schemas.category import CategoryRead
from schemas.comments import CommentsRead
from schemas.user import UserRead


class ProjectsCreate(BaseModel):
    title: str
    description: str = ""
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    status: ProjectStatus = ProjectStatus.DRAFT


class ProjectsUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    # image_url: Optional[str] = None
    category_id: Optional[int] = None
    status: Optional[ProjectStatus] = None


class ProjectsRead(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    image_url: str = ""
    owner: UserRead
    category: Optional[CategoryRead] = None
    status: ProjectStatus
    like_count: int
    created_at: datetime
    updated_at: datetime


class ProjectUpdateStatus(BaseModel):
    status: ProjectStatus


class ProjectsReadWithComents(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    image_url: str = ""
    owner: UserRead
    category: Optional[CategoryRead] = None
    status: ProjectStatus
    like_count: int
    comments: list[CommentsRead]
    created_at: datetime
    updated_at: datetime
