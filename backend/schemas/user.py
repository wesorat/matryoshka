import datetime
from typing import Optional

from fastapi_users import schemas
from fastapi_users.models import ID
from pydantic import BaseModel, Field



class UserRead(schemas.BaseUser[ID]):
    name: str
    image_url: str
    bio: Optional[str] = None
    skills: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    is_active: bool = Field(default=True, exclude=True)
    is_superuser: bool = Field(default=False, exclude=True)
    is_verified: bool = Field(default=False, exclude=True)


class UserReadMain(BaseModel):
    id: int
    name: str
    email: str
    image_url: str


class UserCreate(schemas.BaseUserCreate):
    name: str
    image_url: Optional[str] = ""
    bio: Optional[str] = ""
    skills: Optional[str] = ""

    is_active: bool = Field(default=True, exclude=True)
    is_superuser: bool = Field(default=False, exclude=True)
    is_verified: bool = Field(default=False, exclude=True)


class UserUpdate(schemas.BaseUserUpdate):
    name: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None

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



