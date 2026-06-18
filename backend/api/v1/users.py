from fastapi import APIRouter


user_router = APIRouter(
    prefix="/users",
    tags=['Users'],
)


@user_router.get("/")
async def get_users():
    return {
        "get_users": "ok",
    }
