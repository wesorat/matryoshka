from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from utils.get_datetime_utc_now import get_datetime_utc_now



class Comments(Base):
    __tablename__ = "project_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    text: Mapped[str] = mapped_column(
        String(length=500), nullable=False,
    )
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=get_datetime_utc_now
    )

    project: Mapped["Projects"] = relationship("Projects", back_populates="comments")
    user: Mapped["User"] = relationship("User", back_populates="comments", lazy="selectin")
