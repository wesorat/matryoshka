from core.dependencies import SessionDep
from models.likes import Likes
from repositories.likes import LikesRepository


class LikesService:
    def __init__(self, session: SessionDep):
        self.session = session
        self.repo = LikesRepository(session=session)

    async def create(self, user_id: int, project_id: int) -> Likes:

        like = Likes(user_id=user_id, project_id=project_id)
        await self.repo.create(like)
        await self.session.commit()

        return like

    async def delete(self, user_id: int, project_id: int) -> int:
        like = Likes(user_id=user_id, project_id=project_id)
        count = await self.repo.delete(like)
        if count == 0:
            await self.session.rollback()
        else:
            await self.session.commit()
        return count
