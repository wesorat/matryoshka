from sqlalchemy import ForeignKey, Integer, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Likes(Base):
    __tablename__ = "project_likes"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id"))

    __table_args__ = (PrimaryKeyConstraint("user_id", "project_id"),)

    project: Mapped["Projects"] = relationship("Projects", back_populates="likes")
