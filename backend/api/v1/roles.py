from fastapi import APIRouter

from api.v1.dependencies import RolesServiceDep
from schemas.user import Roles

roles_router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
)

@roles_router.get(
    "/",
    summary="Get roles",
    response_model=list[Roles],
)
async def get_all(service: RolesServiceDep, limit: int = 20):
    users = await service.get_all(limit)
    return users


