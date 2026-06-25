from sqlalchemy import delete, select, update

from core.dependencies import SessionDep
from core.exceptions import ProjectNotFound
from models.comments import Comments
from models.likes import Likes
from models.project import Projects


class CommentsRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def create(self, comment: Comments) -> Comments:
        self.session.add(comment)

        return comment

    async def delete(self, user_id: int, comment_id: int) -> int:
        res = await self.session.execute(
            delete(Comments).where(
                Comments.id == comment_id, Comments.user_id == user_id
            )
        )
        return res.rowcount
