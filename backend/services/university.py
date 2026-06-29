from core.dependencies import SessionDep
from models.university import University
from repositories.university import UniversityRepository


class UniversityService:
    def __init__(self, session: SessionDep):
        self.session = session
        self.repo = UniversityRepository(session=session)

    async def get_all(self, count: int) -> list[University]:
        roles = await self.repo.get_all(count)
        return roles
