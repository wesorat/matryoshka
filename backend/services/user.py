from email.mime import image

from fastapi import UploadFile
from fastapi_users import BaseUserManager

from core.dependencies import SessionDep
from models.category import Category
from models.media import MediaView
from models.user import User

from slugify import slugify

from schemas.user import UserUpdate
from services.media import MediaStorageService
from services.storage import storage


class UserService:
    def __init__(self, session: SessionDep, user_manager: BaseUserManager[User, int]):
        self.session = session
        self.user_manager = user_manager
        self.storage_service = MediaStorageService()

    async def save_image(self, user: User, file: UploadFile) -> str:
        if user.image_url == "":
            user.image_url = await self.storage_service.create(file, MediaView.IMAGE)
        else:
            user.image_url = await self.storage_service.update(user.image_url, file, MediaView.IMAGE)


        await self.user_manager.update(
            user_update=UserUpdate(image_url=user.image_url),
            user=user,
            safe=True
        )
        return user.image_url

    async def delete_image(self, user: User) -> None:
        if user.image_url != "":
            await self.storage_service.delete(user.image_url)

        await self.user_manager.update(
            user_update=UserUpdate(image_url=""),
            user=user,
            safe=True
        )