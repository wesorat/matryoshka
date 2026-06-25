from typing import Annotated

from fastapi import Depends

from core.dependencies import SessionDep
from models.user import User
from services.category import CategoryService
from services.comments import CommentsService
from services.likes import LikesService
from services.media import MediaService
from services.projects import ProjectService
from services.auth import current_active_user, current_active_user_optional


async def get_category_service(session: SessionDep) -> CategoryService:
    return CategoryService(session)


async def get_project_service(session: SessionDep) -> ProjectService:
    return ProjectService(session)


async def get_like_service(session: SessionDep) -> LikesService:
    return LikesService(session)

async def get_comment_service(session: SessionDep) -> CommentsService:
    return CommentsService(session)

async def get_media_service() -> MediaService:
    return MediaService()

CategoryServiceDep = Annotated[CategoryService, Depends(get_category_service)]
ProjectServiceDep = Annotated[ProjectService, Depends(get_project_service)]
LikesServiceDep = Annotated[LikesService, Depends(get_like_service)]
CommentsServiceDep = Annotated[CommentsService, Depends(get_comment_service)]
MediaServiceDep = Annotated[MediaService, Depends(get_media_service)]

CurrentUserDep = Annotated[User, Depends(current_active_user)]
CurrentUserOptionalDep = Annotated[User, Depends(current_active_user_optional)]
