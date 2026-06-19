

import uvicorn
from fastapi import Depends, FastAPI

from api.v1.users import user_router
from models.user import User
from schemas.user import UserRead, UserCreate, UserUpdate
from services.user import auth_backend, current_active_user, fastapi_users


def create_app() -> FastAPI:
    app = FastAPI()
    include_routers(app)

    return app


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
        fastapi_users.get_reset_password_router(),
        prefix="/auth",
        tags=["auth"],
    )
    app.include_router(
        fastapi_users.get_verify_router(UserRead),
        prefix="/auth",
        tags=["auth"],
    )
    app.include_router(
        fastapi_users.get_users_router(UserRead, UserUpdate),
        prefix="/users",
        tags=["users"],
    )
    @app.get("/authenticated-route")
    async def authenticated_route(user: User = Depends(current_active_user)):
        return {"message": f"Hello {user.email}!"}


if __name__ == "__main__":
    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)
