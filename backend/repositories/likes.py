from sqlalchemy import delete, select, update

from core.dependencies import SessionDep
from core.exceptions import ProjectNotFound
from models.likes import Likes
from models.project import Projects


class LikesRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def create(self, like: Likes) -> Likes:
        self.session.add(like)
        await self.session.execute(
            update(Projects)
            .where(Projects.id == like.project_id)
            .values(like_count=Projects.like_count + 1)
        )
        return like

    async def delete(self, like: Likes) -> int:
        res = await self.session.execute(
            delete(Likes).where(
                Likes.user_id == like.user_id, Likes.project_id == like.project_id
            )
        )
        await self.session.execute(
            update(Projects)
            .where(Projects.id == like.project_id)
            .values(like_count=Projects.like_count - 1)
        )
        return res.rowcount
