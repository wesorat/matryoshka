from sqlalchemy import delete, select, update
from sqlalchemy.orm import selectinload

from core.dependencies import SessionDep
from models.invites import ProjectInvite, InviteStatus


class InviteRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def create(self, invite: ProjectInvite) -> ProjectInvite:
        self.session.add(invite)
        await self.session.flush()
        await self.session.refresh(
        invite,
        attribute_names=['project', 'invitee', 'role']
    )
        return invite

    async def get_by_id(self, invite_id: int) -> ProjectInvite | None:
        result = await self.session.execute(
            select(ProjectInvite)
            .where(ProjectInvite.id == invite_id)
            .options(
                selectinload(ProjectInvite.project),
                selectinload(ProjectInvite.inviter),
                selectinload(ProjectInvite.invitee)
            )
        )
        return result.scalar_one_or_none()

    async def get_by_project_and_invitee(self, project_id: int, invitee_id: int) -> ProjectInvite | None:
        result = await self.session.execute(
            select(ProjectInvite)
            .where(
                ProjectInvite.project_id == project_id,
                ProjectInvite.invitee_id == invitee_id,
                ProjectInvite.status == InviteStatus.PENDING
            )
            .options(
                selectinload(ProjectInvite.project),
                selectinload(ProjectInvite.inviter),
                selectinload(ProjectInvite.invitee)
            )
        )
        return result.scalar_one_or_none()

    async def get_pending_by_invitee(self, invitee_id: int) -> list[ProjectInvite]:
        result = await self.session.execute(
            select(ProjectInvite)
            .where(
                ProjectInvite.invitee_id == invitee_id,
                ProjectInvite.status == InviteStatus.PENDING
            )
            .options(
                selectinload(ProjectInvite.project),
                selectinload(ProjectInvite.inviter)
            )
            .order_by(ProjectInvite.id.desc())
        )
        return list(result.scalars().all())

    async def get_by_inviter(self, inviter_id: int) -> list[ProjectInvite]:
        result = await self.session.execute(
            select(ProjectInvite)
            .where(ProjectInvite.inviter_id == inviter_id)
            .options(
                selectinload(ProjectInvite.project),
                selectinload(ProjectInvite.invitee)
            )
            .order_by(ProjectInvite.id.desc())
        )
        return list(result.scalars().all())

    async def get_by_project(self, project_id: int) -> list[ProjectInvite]:
        result = await self.session.execute(
            select(ProjectInvite)
            .where(ProjectInvite.project_id == project_id)
            .options(
                selectinload(ProjectInvite.inviter),
                selectinload(ProjectInvite.invitee)
            )
            .order_by(ProjectInvite.id.desc())
        )
        return list(result.scalars().all())

    async def accept(self, invite_id: int, user_id: int) -> ProjectInvite:
        invite = await self.get_by_id(invite_id)

        if not invite:
            raise ValueError(f"Invite with ID {invite_id} not found")

        if invite.invitee_id != user_id:
            raise PermissionError("You cannot accept this invite")

        if invite.status != InviteStatus.PENDING:
            raise ValueError(f"Invite already {invite.status.value}")

        await self.session.execute(
            update(ProjectInvite)
            .where(ProjectInvite.id == invite_id)
            .values(status=InviteStatus.ACCEPTED)
        )

        await self.session.flush()
        await self.session.refresh(invite, attribute_names=["project", "inviter", "invitee"])

        return invite

    async def reject(self, invite_id: int, user_id: int) -> ProjectInvite:
        invite = await self.get_by_id(invite_id)

        if not invite:
            raise ValueError(f"Invite with ID {invite_id} not found")

        if invite.invitee_id != user_id:
            raise PermissionError("You cannot reject this invite")

        if invite.status != InviteStatus.PENDING:
            raise ValueError(f"Invite already {invite.status.value}")

        await self.session.execute(
            update(ProjectInvite)
            .where(ProjectInvite.id == invite_id)
            .values(status=InviteStatus.REJECTED)
        )

        await self.session.flush()
        await self.session.refresh(invite, attribute_names=["project", "inviter", "invitee"])

        return invite

    async def cancel(self, invite_id: int, user_id: int) -> ProjectInvite:
        invite = await self.get_by_id(invite_id)

        if not invite:
            raise ValueError(f"Invite with ID {invite_id} not found")

        if invite.inviter_id != user_id:
            raise PermissionError("Only inviter can cancel this invite")

        if invite.status != InviteStatus.PENDING:
            raise ValueError(f"Invite already {invite.status.value}")

        await self.session.execute(
            update(ProjectInvite)
            .where(ProjectInvite.id == invite_id)
            .values(status=InviteStatus.CANCELLED)
        )

        await self.session.flush()
        await self.session.refresh(invite, attribute_names=["project", "inviter", "invitee"])

        return invite

    async def delete(self, invite_id: int, user_id: int) -> int:
        invite = await self.get_by_id(invite_id)

        if not invite:
            return 0

        if invite.inviter_id != user_id:
            raise PermissionError("You cannot delete this invite")

        result = await self.session.execute(
            delete(ProjectInvite).where(ProjectInvite.id == invite_id)
        )

        return result.rowcount

    async def delete_by_project(self, project_id: int) -> int:
        result = await self.session.execute(
            delete(ProjectInvite).where(ProjectInvite.project_id == project_id)
        )
        return result.rowcount

    async def delete_by_project_user(self, project_id: int, user_id: int) -> int:
        result = await self.session.execute(
            delete(ProjectInvite).where(ProjectInvite.project_id == project_id, ProjectInvite.invitee_id == user_id)
        )
        return result.rowcount

    async def delete_by_invitee(self, invitee_id: int) -> int:
        result = await self.session.execute(
            delete(ProjectInvite).where(ProjectInvite.invitee_id == invitee_id)
        )
        return result.rowcount