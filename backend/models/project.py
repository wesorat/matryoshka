
from datetime import datetime
from enum import Enum

from sqlalchemy import PrimaryKeyConstraint, String, DateTime, ForeignKey, Integer, Enum as SQLEnum
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
    description: Mapped[str] = mapped_column(String)
    image_url: Mapped[str] = mapped_column(String(length=500))
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("project_category.id"))
    status: Mapped[ProjectStatus] = mapped_column(SQLEnum(ProjectStatus, name="project_status"), default=ProjectStatus.DRAFT)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=get_datetime_utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=get_datetime_utc_now,
        onupdate=get_datetime_utc_now,
    )

    owner: Mapped["User"] = relationship("User", back_populates="projects")
    category: Mapped["ProjectsCategory"] = relationship("ProjectsCategory", back_populates="projects")
    members: Mapped[list["MemberRoles"]] = relationship(
        "MemberRoles",
        back_populates="project",
        cascade="all, delete-orphan"
    )


class MemberRoles(Base):
    __tablename__ = "member_roles"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(length=100), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint('user_id', 'project_id'),
    )

    user: Mapped["User"] = relationship("User", back_populates="project_members")
    project: Mapped["Projects"] = relationship("Projects", back_populates="members")



