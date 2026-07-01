from typing import Optional

from fastapi import APIRouter

from api.v1.dependencies import UniversityServiceDep

from schemas.university import UniversityRead

university_router = APIRouter(
    prefix="/university",
    tags=["University"],
)


@university_router.get("/", summary="Get all universities", response_model=list[UniversityRead])
async def get_all(
    service: UniversityServiceDep,
    count: Optional[int] = 500
):
    universities = await service.get_all(count)
    return universities

