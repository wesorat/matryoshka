
from api.v1.category import category_router
from api.v1.projects import project_router
from api.v1.user import user_router
from api.v1.likes import likes_router
from api.v1.comments import comments_router
from api.v1.media import media_router
from api.v1.invites import invites_router
from api.v1.roles import roles_router
from api.v1.university import university_router
from schemas.user import UserCreate, UserRead, UserUpdate
from services.auth import auth_backend, fastapi_users


def include_routers(app):
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

    app.include_router(user_router)
    app.include_router(category_router)
    app.include_router(project_router)
    app.include_router(media_router)
    app.include_router(likes_router)
    app.include_router(comments_router)
    app.include_router(invites_router)
    app.include_router(roles_router)
    app.include_router(university_router)
