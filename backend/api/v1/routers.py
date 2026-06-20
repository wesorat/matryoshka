from fastapi import Depends

from api.v1.users import user_router
from models.user import User
from schemas.user import UserRead, UserCreate, UserUpdate
from services.user import auth_backend, fastapi_users


def include_routers(app):
    app.include_router(user_router)

    app.include_router(
        fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"]
    )
    app.include_router(
        fastapi_users.get_register_router(UserRead, UserCreate),
        prefix="/auth",
        tags=["auth"],
    )
    app.include_router(
        fastapi_users.get_users_router(UserRead, UserUpdate),
        prefix="/users",
        tags=["users"],
    )
