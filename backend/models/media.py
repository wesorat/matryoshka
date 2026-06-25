from enum import Enum

from sqlalchemy import ForeignKey, Integer, String, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class MediaView(Enum):
    IMAGE = "image"
    VIDEO = "video"


class Media(Base):
    __tablename__ = "project_media"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    filename: Mapped[str] = mapped_column(
        String(length=100), nullable=False, unique=True
    )
    view: Mapped[MediaView] = mapped_column(
        SQLEnum(MediaView, name="media_view"), default=MediaView.IMAGE
    )
    project_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("projects.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    project: Mapped["Projects"] = relationship("Projects", back_populates="medias")
