from fastapi import APIRouter

from api.v1.dependencies import MembersServiceDep
from schemas.user import UserRead

user_router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

@user_router.get(
    "/search/{name}",
    summary="Search user by title",
    response_model=list[UserRead],
)
async def search_user(name: str, service: MembersServiceDep):
    users = await service.search_by_name(name)
    return users

