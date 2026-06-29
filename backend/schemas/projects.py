from datetime import datetime
from typing import Optional

from pydantic import BaseModel, computed_field

from models.project import ProjectStatus
from schemas.category import CategoryRead
from schemas.comments import CommentsRead
from schemas.media import MediaRead
from schemas.project_technology import ProjectTechnologyRead
from schemas.university import UniversityRead
from schemas.user import MemberRead, UserRead




class ProjectsCreate(BaseModel):
    title: str
    description: str = ""
    category_id: Optional[int] = None
    status: ProjectStatus = ProjectStatus.PUBLISHED
    university_id: Optional[int] = None

    practical_benefit: Optional[str] = ""
    implementation_details: Optional[str] = ""
    results: Optional[str] = ""


class ProjectsUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    # image_url: Optional[str] = None
    category_id: Optional[int] = None
    university_id: Optional[int] = None
    status: Optional[ProjectStatus] = None
    practical_benefit: Optional[str] = ""
    implementation_details: Optional[str] = ""
    results: Optional[str] = ""


class ProjectsReadOne(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    image_url: str = ""
    owner: UserRead
    university: Optional[UniversityRead] = None
    member_roles: list[MemberRead]
    category: Optional[CategoryRead] = None
    status: ProjectStatus
    medias: list[MediaRead]
    project_technologies: list[ProjectTechnologyRead]
    like_count: int
    practical_benefit: Optional[str] = ""
    implementation_details: Optional[str] = ""
    results: Optional[str] = ""

    comments: list[CommentsRead]
    created_at: datetime
    updated_at: datetime



class ProjectsRead(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    image_url: str = ""
    owner: UserRead
    university: Optional[UniversityRead] = None
    category: Optional[CategoryRead] = None
    status: ProjectStatus
    like_count: int

    created_at: datetime
    updated_at: datetime


class ProjectUpdateStatus(BaseModel):
    status: ProjectStatus


class ProjectFilterParams(BaseModel):
    university_id: Optional[int] = None
    category_id: Optional[int] = None
    technologies: list[int]
    limit: int = 100