from fastapi import APIRouter

from api.v1.dependencies import CategoryServiceDep, CurrentUserDep
from core.dependencies import SessionDep
from schemas.category import CategoryCreate, CategoryRead
from services.category import CategoryService

category_router = APIRouter(
    prefix="/category",
    tags=["Categories"],
)


@category_router.post("/", summary="Create category", response_model=CategoryRead)
async def create(
    category_service: CategoryServiceDep,
    category: CategoryCreate,
):
    category = await category_service.create(category)
    return category


@category_router.get("/{id}", summary="Get category", response_model=CategoryRead)
async def get(
    category_service: CategoryServiceDep,
    id: int,
):
    category = await category_service.get(id)
    return category


@category_router.get(
    "/", summary="Get all categories", response_model=list[CategoryRead]
)
async def get_all(
    category_service: CategoryServiceDep,
):
    categories = await category_service.get_all()
    return categories


@category_router.delete("/{id}", summary="Delete category")
async def delete(
    category_service: CategoryServiceDep,
    id: int,
):
    count = await category_service.delete(id)

    return {"count_deleted": count}
