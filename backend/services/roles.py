from core.dependencies import SessionDep
from models.comments import Comments
from models.project import Role
from repositories.comments import CommentsRepository
from repositories.roles import RolesRepository
from schemas.comments import CommentsCreate


class RolesService:
    def __init__(self, session: SessionDep):
        self.session = session
        self.repo = RolesRepository(session=session)

    async def get_all(self, count: int) -> list[Role]:
        roles = await self.repo.get_all(count)
        return roles
