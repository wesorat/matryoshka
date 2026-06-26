
from sqlalchemy import delete, or_, update, select

from core.dependencies import SessionDep

from models.project import MemberRoles
from models.user import User


class MembersRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def add_member(self, member: MemberRoles) -> MemberRoles:
        self.session.add(member)
        return member

    async def get_user(self, user_id: int, email: str) -> User:
        res = await self.session.execute(select(User).where(
            or_(User.id == user_id, User.email == email)))
        return res.scalar_one_or_none()

    async def create_user(self, user: User) -> User:
        self.session.add(user)
        return user

    async def remove_member(self, user_id: int, project_id: int) -> None:
        res = await self.session.execute(delete(MemberRoles).where(MemberRoles.user_id==user_id, MemberRoles.project_id == project_id))
        return res.rowcount


