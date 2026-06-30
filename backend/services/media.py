from pathlib import Path
import uuid

from fastapi import UploadFile

from core.dependencies import SessionDep
from models.media import Media, MediaView
from repositories.media import MediaRepository
from schemas.media import MediaCreate, MediaRead
from services.storage import storage


class MediaService:
    def __init__(self, session: SessionDep):
        self.session = session
        self.repo = MediaRepository(session=session)
        self.media_storage = MediaStorageService()

    async def create(
        self, user_id: int, file: UploadFile, media: MediaCreate
    ) -> MediaRead:

        media_dict = media.model_dump()
        created_media = Media(**media_dict)

        created_media = await self.repo.create(user_id, created_media)
        filename = await self.media_storage.create(file, media.view)
        created_media.filename = filename
        await self.session.commit()
        return created_media

    async def get(self, media_id: int) -> Media:
        return await self.repo.get(media_id)

    async def get_all(self, project_id: int) -> list[Media]:
        return await self.repo.get_all(project_id)

    async def delete(self, user_id: int, project_id: int, media_id: int) -> None:
        filename = await self.repo.delete(user_id, project_id, media_id)
        if filename == "" or filename is None:
            raise FileNotFoundError()
        await self.media_storage.delete(filename)
        await self.session.commit()


# переделать для видео
class MediaStorageService:
    def __init__(self):
        self.storage = storage
        self.max_size_video = 250 * 1024 * 1024  # 250 MB
        self.max_size_image = 25 * 1024 * 1024  # 25 MB
        self.allowed_images = {
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
        }

        self.allowed_videos = {
            ".mp4",
            ".avi",
            ".mov",
            ".webm",
}

    async def create(self, file: UploadFile, view: MediaView) -> str:
        await self._validate_media(file, view)
        filename = self._generate_filename(file.filename)

        content = await file.read()
        await self.save(filename, content)
        return filename

    async def update(self, filename: str, file: UploadFile, view: MediaView) -> str:
        await self._validate_media(file, view)
        await self.delete(filename)
        ext = Path(file.filename).suffix.lower()
        filename = ''.join(filename.split(".")[:-1]) + ext
        content = await file.read()
        print(filename)
        print('*' * 100)

        await self.save(filename, content)
        return filename

    async def save(self, filename: str, context: bytes):
        storage.save(filename, context)

    async def delete(self, filename: str):
        storage.delete(filename)

    async def _validate_media(self, file: UploadFile, view: MediaView):
        if view == MediaView.IMAGE:
            if file.size > self.max_size_image:
                raise ValueError(
                    f"Файл слишком большой. Максимум: {self.max_size // (1024*1024)} MB"
                )
            ext = Path(file.filename).suffix.lower()
            if ext not in self.allowed_images:
                raise ValueError(
                    f"Недопустимый формат. Разрешены: {', '.join(self.allowed_images)}"
                )
        elif view == MediaView.VIDEO:
            if file.size > self.max_size_video:
                raise ValueError(
                    f"Файл слишком большой. Максимум: {self.max_size_video // (1024*1024)} MB"
                )
            ext = Path(file.filename).suffix.lower()
            if ext not in self.allowed_videos:
                raise ValueError(
                    f"Недопустимый формат. Разрешены: {', '.join(self.allowed_videos)}"
                )

    def _generate_filename(self, original: str) -> str:
        ext = Path(original).suffix.lower()
        return f"{uuid.uuid4()}{ext}"

    async def get_filepath(self, filename: str) -> str:
        return storage.full_path(filename)
