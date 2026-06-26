from sqlalchemy import delete

from core.dependencies import SessionDep
from models.comments import Comments


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
