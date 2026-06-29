from sqlalchemy import delete, func, select

from core.dependencies import SessionDep
from models.project import Role
from models.university import University


class UniversityRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def get_all(self, count: int = 100) -> list[University]:
        res = await self.session.execute(select(University).order_by(Role.name).limit(count))
        return res.scalars().all()

