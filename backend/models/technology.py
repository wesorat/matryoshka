

from sqlalchemy import ForeignKey, Integer, PrimaryKeyConstraint, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Technology(Base):
    __tablename__ = "technology"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    name: Mapped[str] = mapped_column(String(length=50), unique=True, nullable=False)

    project_technology: Mapped[list["ProjectTechnology"]] = relationship("ProjectTechnology", back_populates="technology", lazy="selectin")


class ProjectTechnology(Base):
    __tablename__ = "project_technology"

    technology_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("technology.id", ondelete="CASCADE")
    )
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE")
    )

    __table_args__ = (PrimaryKeyConstraint("technology_id", "project_id"),)

    project: Mapped["Projects"]  = relationship("Projects", back_populates="project_technologies",lazy="selectin")
    technology: Mapped["Technology"]  = relationship("Technology", back_populates="project_technology",lazy="selectin")


