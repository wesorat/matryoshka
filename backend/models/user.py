from datetime import datetime

from fastapi_users.db import SQLAlchemyBaseUserTable
from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from utils.get_datetime_utc_now import get_datetime_utc_now


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(length=100), nullable=False)
    avatar: Mapped[str] = mapped_column(String(length=100), default="")
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

    roles = relationship("MemberRoles", back_populates="users")

    @property
    def projects(self):
        return [i.projects for i in self.roles]

