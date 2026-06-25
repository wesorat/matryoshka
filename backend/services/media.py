from pathlib import Path
import uuid

from fastapi import UploadFile

from core.dependencies import SessionDep
from services.storage import storage


# переделать
class MediaService:
    def __init__(self, ):
        self.storage = storage
        self.max_size = 100 * 1024 * 1024  # 100 MB
        self.allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.mp4', '.avi', '.mov', '.webm'}

    async def create(self, file: UploadFile) -> str:
        await self._validate_media(file)
        filename = self._generate_filename(file.filename)
        content = await file.read()
        await self.save(filename, content)
        return filename

    async def update(self, filename: str,  file: UploadFile) -> str:
        await self._validate_media(file)
        content = await file.read()
        await self.save(filename, content)
        return filename

    async def save(self, filename: str, context: bytes):
        storage.save(filename, context)



    async def delete(self, filename: str):
        storage.delete(filename)


    async def _validate_media(self, file: UploadFile):
        if file.size > self.max_size:
            raise ValueError(f"Файл слишком большой. Максимум: {self.max_size // (1024*1024)} MB")

        ext = Path(file.filename).suffix.lower()
        if ext not in self.allowed_extensions:
            raise ValueError(f"Недопустимый формат. Разрешены: {', '.join(self.allowed_extensions)}")


    def _generate_filename(self, original: str) -> str:
        ext = Path(original).suffix.lower()
        return f"{uuid.uuid4()}{ext}"

    async def get_filepath(self, filename: str) -> str:
        return storage.full_path(filename)


