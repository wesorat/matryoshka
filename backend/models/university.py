
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class University(Base):
    __tablename__ = "universities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(length=200), nullable=False, unique=True)


    projects: Mapped[list["Projects"]] = relationship(
        "Projects", back_populates="university", lazy="selectin"
    )
    users: Mapped[list["User"]] = relationship(
        "User", back_populates="university", lazy="selectin"
    )
