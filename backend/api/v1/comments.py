from fastapi import APIRouter

from api.v1.dependencies import CommentsServiceDep, CurrentUserDep

from schemas.comments import CommentsRead, CommentsCreate

comments_router = APIRouter(
    prefix="/comments",
    tags=["Comments"],
)


@comments_router.post("/", summary="Create comment", response_model=CommentsRead)
async def create(
    comment_service: CommentsServiceDep, user: CurrentUserDep, comment: CommentsCreate
):
    user_id = user.id
    created_comment = await comment_service.create(user_id, comment)
    return created_comment



@comments_router.delete("/", summary="Delete comment")
async def delete(
    comment_service: CommentsServiceDep,
    user: CurrentUserDep,
    comment_id: int,
):
    user_id = None if user.is_superuser else user.id
    count = await comment_service.delete(user_id, comment_id)

    return {"count_deleted": count}


@comments_router.get(
    "/search/{name}",
    summary="Search user by title",
    response_model=list[CommentsRead],
)
async def search_comments(text: str, service: CommentsServiceDep):
    comments = await service.search_by_text(text)
    return comments 