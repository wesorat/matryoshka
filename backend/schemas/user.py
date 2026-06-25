import datetime
from typing import Optional

from fastapi_users import schemas
from fastapi_users.models import ID
from pydantic import BaseModel, Field


class UserRead(schemas.BaseUser[ID]):
    name: str
    avatar: str
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
    avatar: str


class UserCreate(schemas.BaseUserCreate):
    name: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None

    is_active: bool = Field(default=True, exclude=True)
    is_superuser: bool = Field(default=False, exclude=True)
    is_verified: bool = Field(default=False, exclude=True)


class UserUpdate(schemas.BaseUserUpdate):
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None

    is_active: bool = Field(default=True, exclude=True)
    is_superuser: bool = Field(default=False, exclude=True)
    is_verified: bool = Field(default=False, exclude=True)
