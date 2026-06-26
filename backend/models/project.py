from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Integer, PrimaryKeyConstraint, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.comments import Comments
from models.media import Media

from db.base import Base
from utils.get_datetime_utc_now import get_datetime_utc_now


class ProjectStatus(Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class Projects(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(length=200), nullable=False)
    slug: Mapped[str] = mapped_column(String(length=200), nullable=False)
    description: Mapped[str] = mapped_column(String, default="")
    image_url: Mapped[str] = mapped_column(String(length=500), default="")
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("project_category.id"), nullable=True
    )
    status: Mapped[ProjectStatus] = mapped_column(
        SQLEnum(ProjectStatus, name="project_status"), default=ProjectStatus.DRAFT
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=get_datetime_utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=get_datetime_utc_now,
        onupdate=get_datetime_utc_now,
    )

    category: Mapped[Optional["Category"]] = relationship(
        "Category", back_populates="projects", lazy="selectin"
    )

    member_roles: Mapped[list["MemberRoles"]] = relationship(
        "MemberRoles", back_populates="projects"
    )

    comments: Mapped[list["Comments"]] = relationship(
        "Comments", back_populates="project"
    )
    likes: Mapped[list["Likes"]] = relationship("Likes", back_populates="project")

    owner: Mapped["User"] = relationship(
        "User", back_populates="own_projects", lazy="selectin"
    )
    medias: Mapped[list["Media"]] = relationship("Media", back_populates="project")

    @property
    def members(self):
        return [i.user for i in self.member_roles]


class MemberRoles(Base):
    __tablename__ = "member_roles"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE")
    )
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE")
    )
    role: Mapped[str] = mapped_column(String(length=100), nullable=False)

    __table_args__ = (PrimaryKeyConstraint("user_id", "project_id"),)

    projects = relationship("Projects", back_populates="member_roles")
    user = relationship("User", back_populates="roles", lazy="selectin")
