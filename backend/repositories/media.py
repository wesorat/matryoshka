from sqlalchemy import delete, select

from core.dependencies import SessionDep
from models.media import Media
from models.project import Projects


class MediaRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def create(self, user_id: int, media: Media) -> Media:
        project = await self.session.get(Projects, media.project_id)
        if not project:
            raise ValueError(f"Project {media.project_id} not found")
        if project.owner_id != user_id:
            raise PermissionError("Only project owner can add media")

        self.session.add(media)
        return media

    async def get(self, media_id: int) -> Media:
        media = await self.session.get(Media, media_id)
        return media

    async def get_all(self, project_id: int) -> list[Media]:
        media = await self.session.execute(
            select(Media).where(Media.project_id == project_id)
        )
        return media

    async def delete(self, user_id: int, project_id: int, media_id: int) -> str:
        project = await self.session.get(Projects, project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        if project.owner_id != user_id:
            raise PermissionError("Only project owner can add media")
        filename = await self.session.execute(
            delete(Media).where(Media.id == media_id).returning(Media.filename)
        )
        return filename.scalar_one_or_none()
