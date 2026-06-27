from click import File
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi_users import BaseUserManager

from api.v1.dependencies import CurrentUserDep, MembersServiceDep
from core.dependencies import SessionDep
from models.user import User
from schemas.user import UserRead
from services.auth import get_user_manager
from services.user import UserService

user_router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@user_router.get(
    "/search/{name}",
    summary="Search user by title",
    response_model=list[UserRead],
)
async def search_user(name: str, service: MembersServiceDep):
    users = await service.search_by_name(name)
    return users


@user_router.post("/me/avatar")
async def upload_avatar(
    current_user: CurrentUserDep,
    session: SessionDep,
    user_manager: BaseUserManager[User, int] = Depends(get_user_manager),
    file: UploadFile = File(...),

):
    user_service = UserService(session, user_manager)
    image_url = await user_service.save_image(current_user, file)
    return {"image_url": image_url}


@user_router.delete("/me/avatar")
async def delete_avatar(
    current_user: CurrentUserDep,
    session: SessionDep,
    user_manager: BaseUserManager[User, int] = Depends(get_user_manager),

):
    try:
        user_service = UserService(session, user_manager)
        image_url = await user_service.delete_image(current_user)
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))