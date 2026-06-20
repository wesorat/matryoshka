from typing import Annotated

from fastapi import Depends

from core.dependencies import SessionDep
from services.category import CategoryService


async def get_category_service(session: SessionDep) -> CategoryService:
    return CategoryService(session)

CategoryServiceDep = Annotated[CategoryService, Depends(get_category_service)]

