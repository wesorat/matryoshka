
from sqlalchemy import delete, select

from core.dependencies import SessionDep

from models.project import MemberRoles
from models.user import User


class MembersRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def add_member(self, member: MemberRoles) -> MemberRoles:
        self.session.add(member)
        return member

    async def get_user(self, user_id: int) -> User:
        res = await self.session.execute(select(User).where(
            User.id == user_id))
        return res.scalar_one_or_none()

    async def remove_member(self, user_id: int, project_id: int) -> None:
        res = await self.session.execute(delete(MemberRoles).where(MemberRoles.user_id==user_id, MemberRoles.project_id == project_id))
        return res.rowcount

    async def search_by_name(self, name: str) -> list[User]:
        res = await self.session.execute(
            select(User)
            .where(
                User.name.ilike(f"%{name}%"),
            )
        )
        return res.scalars().all()
