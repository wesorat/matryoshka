from typing import Annotated, Optional

from fastapi import Depends, Form

from core.dependencies import SessionDep
from models.media import MediaView
from models.project import ProjectStatus
from models.user import User
from schemas.media import MediaCreate
from schemas.projects import ProjectsCreate, ProjectsUpdate
from services.category import CategoryService
from services.comments import CommentsService
from services.invites import InviteService
from services.likes import LikesService
from services.media import MediaService, MediaStorageService
from services.members import MembersService
from services.projects import ProjectService
from services.auth import current_active_user, current_active_user_optional, current_superuser
from services.roles import RolesService
from services.technology import TechnologyService
from services.university import UniversityService
from services.user import UserService


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

async def get_university_service(session: SessionDep) -> UniversityService:
    return UniversityService(session)

async def get_technology_service(session: SessionDep) -> TechnologyService:
    return TechnologyService(session)


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
UniversityServiceDep = Annotated[UniversityService, Depends(get_university_service)]
TechnologyServiceDep = Annotated[TechnologyService, Depends(get_technology_service)]

CurrentUserDep = Annotated[User, Depends(current_active_user)]
CurrentAdminDep = Annotated[User, Depends(current_superuser)]
CurrentUserOptionalDep = Annotated[User, Depends(current_active_user_optional)]

async def get_projectCreate_from_form(
    title: str = Form(...),
    description: str = Form(""),
    category_id: Optional[int] = Form(None),
    university_id: Optional[int] = Form(None),
    status: ProjectStatus = Form(ProjectStatus.DRAFT),
    practical_benefit: Optional[str] = Form(""),
    implementation_details: Optional[str] = Form(""),
    results: Optional[str] = Form(""),
) -> ProjectsCreate:
    return ProjectsCreate(
        title=title,
        description=description,
        category_id=category_id,
        university_id=university_id,
        status=status,
        practical_benefit=practical_benefit,
        implementation_details=implementation_details,
        results=results
    )

async def get_projectUpdate_from_form(
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    university_id: Optional[int] = Form(None),
    status: Optional[ProjectStatus] = Form(None),
    practical_benefit: Optional[str] = Form(None),
    implementation_details: Optional[str] = Form(None),
    results: Optional[str] = Form(None),
) -> ProjectsUpdate:
    return ProjectsUpdate(
        title=title,
        description=description,
        category_id=category_id,
        university_id=university_id,
        status=status,
        practical_benefit=practical_benefit,
        implementation_details=implementation_details,
        results=results
    )

async def get_mediaCreate_from_form(
    view: MediaView = Form(MediaView.IMAGE),
    project_id: int = Form(...),
) -> MediaCreate:
    return MediaCreate(
        view=view,
        project_id=project_id
    )