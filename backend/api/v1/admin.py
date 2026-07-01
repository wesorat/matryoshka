from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import IntegrityError

from api.v1.dependencies import CommentsServiceDep, CurrentAdminDep, CurrentUserDep, LikesServiceDep, MembersServiceDep, ProjectServiceDep

from schemas.comments import CommentsRead
from schemas.likes import LikesBase
from schemas.projects import ProjectsRead
from schemas.user import UserRead

admin_router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@admin_router.get("/comments", summary="Get all comments", response_model=list[CommentsRead])
async def get_all(
    user: CurrentAdminDep, comment_service: CommentsServiceDep, count: int = 1000
):
    comments = await comment_service.get_all(count)
    return  comments


@admin_router.get(
    "/users/",
    summary="Get all users",
    response_model=list[UserRead],
)
async def get_all(user: CurrentAdminDep, service: MembersServiceDep):
    users = await service.get_all()
    return users

@admin_router.get(
    "/projects/",
    summary="Get all projects",
    response_model=list[ProjectsRead],
)
async def get_all(user: CurrentAdminDep, service: ProjectServiceDep, count: int = 1000):
    users = await service.get_all_by_creating(count)
    return users




