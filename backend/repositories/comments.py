

from sqlalchemy import delete, select

from core.dependencies import SessionDep
from models.comments import Comments


class CommentsRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def create(self, comment: Comments) -> Comments:
        self.session.add(comment)

        return comment

    async def get_all(self, count: int = 1000) -> list[Comments]:
        res = await self.session.execute(select(Comments).order_by(Comments.created_at.desc()).limit(count))
        return res.scalars().all()



    async def delete(self, user_id: int | None, comment_id: int) -> int:
        if user_id is None:
            res = await self.session.execute(
            delete(Comments).where(
                Comments.id == comment_id
            )
        )
        else:
            res = await self.session.execute(
                delete(Comments).where(
                    Comments.id == comment_id, Comments.user_id == user_id
                )
            )
        return res.rowcount
