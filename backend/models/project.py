from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Integer, PrimaryKeyConstraint, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from utils.get_datetime_utc_now import get_datetime_utc_now


class ProjectStatus(Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class Projects(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
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

    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="projects")

    member_roles = relationship("MemberRoles", back_populates="projects")

    @property
    def members(self):
        return [i.users for i in self.member_roles]

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
    users = relationship("User", back_populates="roles")


