from sqlalchemy import delete, func, select

from core.dependencies import SessionDep
from models.project import Role


class RolesRepository:

    def __init__(self, session: SessionDep):
        self.session = session


    async def get_all(self, count: int = 20) -> list[Role]:
        res = await self.session.execute(select(Role).order_by(Role.name).limit(count))
        return res.scalars().all()

