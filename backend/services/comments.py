from core.dependencies import SessionDep
from models.comments import Comments
from repositories.comments import CommentsRepository
from schemas.comments import CommentsCreate


class CommentsService:
    def __init__(self, session: SessionDep):
        self.session = session
        self.repo = CommentsRepository(session=session)

    async def create(self, user_id: int, comment: CommentsCreate) -> Comments:
        comment_dict = comment.model_dump()

        created_comment = Comments(user_id=user_id, **comment_dict)
        await self.repo.create(created_comment)
        await self.session.commit()

        return created_comment

    async def delete(self, user_id: int, comment_id: int) -> int:
        count = await self.repo.delete(user_id, comment_id)
        await self.session.commit()
        return count
