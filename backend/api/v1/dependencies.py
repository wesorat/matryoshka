from typing import Annotated

from fastapi import Depends

from core.dependencies import SessionDep
from models.user import User
from services.category import CategoryService
from services.comments import CommentsService
from services.invites import InviteService
from services.likes import LikesService
from services.media import MediaService, MediaStorageService
from services.members import MembersService
from services.projects import ProjectService
from services.auth import current_active_user, current_active_user_optional
from services.roles import RolesService


async def get_category_service(session: SessionDep) -> CategoryService:
    return CategoryService(session)


async def get_project_service(session: SessionDep) -> ProjectService:
    return ProjectService(session)


async def get_like_service(session: SessionDep) -> LikesService:
    return LikesService(session)


async def get_comment_service(session: SessionDep) -> CommentsService:
    return CommentsService(session)


async def get_media_storage_service() -> MediaStorageService:
    return MediaStorageService()


async def get_media_service(session: SessionDep) -> MediaService:
    return MediaService(session)

async def get_member_service(session: SessionDep) -> MembersService:
    return MembersService(session)

async def get_invite_service(session: SessionDep) -> InviteService:
    return InviteService(session)

async def get_roles_service(session: SessionDep) -> RolesService:
    return RolesService(session)


CategoryServiceDep = Annotated[CategoryService, Depends(get_category_service)]
ProjectServiceDep = Annotated[ProjectService, Depends(get_project_service)]
LikesServiceDep = Annotated[LikesService, Depends(get_like_service)]
CommentsServiceDep = Annotated[CommentsService, Depends(get_comment_service)]
MediaStroageServiceDep = Annotated[
    MediaStorageService, Depends(get_media_storage_service)
]
MediaServiceDep = Annotated[MediaService, Depends(get_media_service)]
MembersServiceDep = Annotated[MembersService, Depends(get_member_service)]
InviteServiceDep = Annotated[InviteService, Depends(get_invite_service)]
RolesServiceDep = Annotated[RolesService, Depends(get_roles_service)]

CurrentUserDep = Annotated[User, Depends(current_active_user)]
CurrentUserOptionalDep = Annotated[User, Depends(current_active_user_optional)]
