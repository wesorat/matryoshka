from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import IntegrityError

from api.v1.dependencies import CurrentUserDep, LikesServiceDep

from schemas.likes import LikesBase

likes_router = APIRouter(
    prefix="/likes",
    tags=["Likes"],
)


@likes_router.post("/", summary="Create like", response_model=LikesBase)
async def create(
    like_service: LikesServiceDep,
    user: CurrentUserDep,
    project_id: int,
):
    try:
        user_id = user.id
        like = await like_service.create(user_id, project_id)
        return like
    except IntegrityError as e:
        if "UNIQUE" in str(e.orig) or "duplicate" in str(e.orig).lower():
            raise HTTPException(
                status_code=409,
                detail=f"Like user_id={user_id} project_id={project_id} уже существует",
            )
        raise e


@likes_router.delete("/", summary="Delete like")
async def delete(
    like_service: LikesServiceDep,
    user: CurrentUserDep,
    project_id: int,
):
    count = await like_service.delete(user.id, project_id)

    return {"count_deleted": count}
