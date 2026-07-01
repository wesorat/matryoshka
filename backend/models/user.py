from datetime import datetime
from typing import Optional

from fastapi_users.db import SQLAlchemyBaseUserTable
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.university import University

from db.base import Base
from utils.get_datetime_utc_now import get_datetime_utc_now


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(length=100), nullable=False)
    university_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("universities.id"), nullable=True
    )
    image_url: Mapped[str] = mapped_column(String(length=500), default="")
    bio: Mapped[str] = mapped_column(String(length=500), default="")
    skills: Mapped[str] = mapped_column(String(length=500), default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=get_datetime_utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=get_datetime_utc_now,
        onupdate=get_datetime_utc_now,
    )

    roles: Mapped[list["MemberRoles"]] = relationship("MemberRoles", back_populates="user",cascade="all, delete-orphan",
        passive_deletes=True,)

    own_projects: Mapped[list["Projects"]] = relationship(
        "Projects",
        back_populates="owner",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    comments: Mapped["Comments"] = relationship(
        "Comments", back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    sent_invites: Mapped[list["ProjectInvite"]] = relationship(
        "ProjectInvite",
        foreign_keys="ProjectInvite.inviter_id",
        back_populates="inviter",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    received_invites: Mapped[list["ProjectInvite"]] = relationship(
        "ProjectInvite",
        foreign_keys="ProjectInvite.invitee_id",
        back_populates="invitee",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    university: Mapped[Optional["University"]] = relationship(
        "University", back_populates="users", lazy="selectin"
    )

    @property
    def projects(self):
        return [i.projects for i in self.roles]


