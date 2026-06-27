from typing import Optional

from core.dependencies import SessionDep
from models.invites import ProjectInvite, InviteStatus
from repositories.invites import InviteRepository
from schemas.invites import InviteCreate
from schemas.user import NewMemberAdd
from services.members import MembersService


class InviteService:

    def __init__(self, session: SessionDep):
        self.session = session
        self.repo = InviteRepository(session)

    async def create_invite(
        self,
        inviter_id: int,
        invite: InviteCreate,
    ) -> ProjectInvite:
        existing_invite = await self.repo.get_by_project_and_invitee(
            invite.project_id, invite.invitee_id
        )

        if existing_invite:
            raise ValueError("User already has a pending invite to this project")
        invite_dict = invite.model_dump()

        created_invite = ProjectInvite(inviter_id=inviter_id, **invite_dict)
        result = await self.repo.create(created_invite)
        await self.session.commit()
        return result


    async def get_invite(self, invite_id: int) -> Optional[ProjectInvite]:
        return await self.repo.get_by_id(invite_id)

    async def get_user_pending_invites(self, user_id: int) -> list[ProjectInvite]:
        return await self.repo.get_pending_by_invitee(user_id)

    async def get_user_sent_invites(self, user_id: int) -> list[ProjectInvite]:
        return await self.repo.get_by_inviter(user_id)

    async def get_project_invites(self, project_id: int) -> list[ProjectInvite]:
        return await self.repo.get_by_project(project_id)

    async def accept_invite(self, invite_id: int, user_id: int) -> ProjectInvite:
        result = await self.repo.accept(invite_id, user_id)

        created_member = await MembersService(self.session).create(result.inviter_id, result.project_id, NewMemberAdd(id=result.invitee_id, role_id=result.role_id))

        await self.session.commit()
        return result

    async def reject_invite(self, invite_id: int, user_id: int) -> ProjectInvite:

        result = await self.repo.reject(invite_id, user_id)
        await self.session.commit()
        return result


    async def cancel_invite(self, invite_id: int, user_id: int) -> ProjectInvite:
        result = await self.repo.cancel(invite_id, user_id)
        await self.session.commit()
        return result


    async def delete_invite(self, invite_id: int, user_id: int) -> int:
        rows_deleted = await self.repo.delete(invite_id, user_id)
        await self.session.commit()
        return rows_deleted


    async def delete_project_invites(self, project_id: int) -> int:
        result = await self.repo.delete_by_project(project_id)
        await self.session.commit()
        return result


    async def delete_user_invites(self, user_id: int) -> int:
        result = await self.repo.delete_by_invitee(user_id)
        await self.session.commit()
        return result


    async def check_pending_invite(self, project_id: int, user_id: int) -> bool:
        invite = await self.repo.get_by_project_and_invitee(project_id, user_id)
        return invite is not None

    async def get_invite_by_project_and_user(
        self,
        project_id: int,
        user_id: int
    ) -> Optional[ProjectInvite]:
        return await self.repo.get_by_project_and_invitee(project_id, user_id)