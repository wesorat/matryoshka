import datetime
from typing import Optional

from fastapi_users import schemas
from fastapi_users.models import ID
from pydantic import BaseModel, ConfigDict, Field

from schemas.university import UniversityRead



class UserRead(schemas.BaseUser[ID]):
    name: str
    image_url: str
    bio: Optional[str] = None
    skills: Optional[str] = None
    university: Optional[UniversityRead] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    is_active: bool = Field(default=True, exclude=True)
    is_superuser: bool = Field(default=False, exclude=True)
    is_verified: bool = Field(default=False, exclude=True)

    model_config = ConfigDict(from_attributes=True)



class UserReadMain(BaseModel):
    id: int
    name: str
    email: str
    university: Optional[UniversityRead] = None
    image_url: str


class UserCreate(schemas.BaseUserCreate):
    name: str
    image_url: Optional[str] = ""
    bio: Optional[str] = ""
    skills: Optional[str] = ""
    university_id: Optional[int] = None


    is_active: bool = Field(default=True, exclude=True)
    is_superuser: bool = Field(default=False, exclude=True)
    is_verified: bool = Field(default=False, exclude=True)


class UserUpdate(schemas.BaseUserUpdate):
    name: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    university_id: Optional[int] = None

    is_active: bool = Field(default=True, exclude=True)
    is_superuser: bool = Field(default=False, exclude=True)
    is_verified: bool = Field(default=False, exclude=True)


class Roles(BaseModel):
    id: int
    name: str
    description: str

class NewMemberAdd(BaseModel):
    id: Optional[int]
    # name: Optional[str] = ""
    # email: EmailStr
    role_id: int


class MemberRead(BaseModel):
    user: UserReadMain
    project_id: int
    role: Roles

class MemberReadCreated(BaseModel):
    user_id: int
    project_id: int
    role: Roles



