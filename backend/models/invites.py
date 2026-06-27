from typing import Optional
from sqlalchemy import Integer, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from db.base import Base

class InviteStatus(Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class ProjectInvite(Base):
    __tablename__ = "project_invites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )
    inviter_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    invitee_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[InviteStatus] = mapped_column(
        SQLEnum(InviteStatus),
        default=InviteStatus.PENDING,
        nullable=False
    )
    message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    project: Mapped["Projects"] = relationship("Projects", back_populates="invites")
    inviter: Mapped["User"] = relationship("User", foreign_keys=[inviter_id], back_populates="sent_invites")
    invitee: Mapped["User"] = relationship("User", foreign_keys=[invitee_id], back_populates="received_invites")

