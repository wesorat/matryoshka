from typing import Annotated

from fastapi import Depends

from core.dependencies import SessionDep
from models.user import User
from services.category import CategoryService
from services.projects import ProjectService
from services.auth import current_active_user, current_active_user_optional


async def get_category_service(session: SessionDep) -> CategoryService:
    return CategoryService(session)


async def get_project_service(session: SessionDep) -> ProjectService:
    return ProjectService(session)


CategoryServiceDep = Annotated[CategoryService, Depends(get_category_service)]
ProjectServiceDep = Annotated[ProjectService, Depends(get_project_service)]

CurrentUserDep = Annotated[User, Depends(current_active_user)]
CurrentUserOptionalDep = Annotated[User, Depends(current_active_user_optional)]
