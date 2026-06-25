from typing import List, Optional

from fastapi import UploadFile
from slugify import slugify

from core.dependencies import SessionDep
from core.exceptions import ProjectNotFound
from models.project import Projects, ProjectStatus
from repositories.projects import ProjectsRepository
from schemas.projects import ProjectsCreate, ProjectsReadOne, ProjectsUpdate
from services.media import MediaStorageService
from services.storage import storage


class ProjectService:
    def __init__(self, session: SessionDep):
        self.session = session
        self.repo = ProjectsRepository(session)

    async def create(
        self, project: ProjectsCreate, user_id: int, file: Optional[UploadFile]
    ) -> Projects:

        project_dict = project.model_dump()

        created_project = Projects(**project_dict)
        created_project.owner_id = user_id

        if file:
            media_service = MediaStorageService()
            created_project.image_url = await media_service.create(file)

        await self.repo.create(created_project)
        await self.session.commit()
        await self.session.refresh(created_project)

        return created_project

    async def get(self, user_id: int, project_id: int) -> ProjectsReadOne:
        return await self.repo.get(user_id, project_id)

    async def get_by_slug(self, user_id: int, slug: str) -> ProjectsReadOne:
        return await self.repo.get_by_slug(user_id, slug)

    async def get_all(self) -> List[Projects]:
        return await self.repo.get_all()

    async def get_my(self, user_id: int) -> List[Projects]:
        return await self.repo.get_my(user_id)

    async def get_projects_by_category(self, category_id: int) -> List[Projects]:
        return await self.repo.get_by_category(category_id)

    async def get_projects_by_category_by_slug(self, slug: str) -> List[Projects]:

        return await self.repo.get_by_category_by_slug(slug)

    async def search_by_title(self, title: str) -> List[Projects]:
        if not title or len(title.strip()) == 1:
            return []
        return await self.repo.search_by_title(title.strip())

    async def update_status(
        self, user_id: int, project_id: int, status: ProjectStatus
    ) -> Projects:
        project = await self.repo.update_status(user_id, project_id, status)
        await self.session.commit()
        return project

    async def update_status(
        self, user_id: int, slug: str, status: ProjectStatus
    ) -> Projects:
        project = await self.repo.update_status_by_slug(user_id, slug, status)
        await self.session.commit()
        return project

    async def delete(self, user_id: int, project_id: int):
        filename = await self.repo.delete(user_id, project_id)
        if filename != "":
            await MediaStorageService().delete(filename)

        await self.session.commit()

    async def delete_by_slug(self, user_id: int, slug: str):
        filename = await self.repo.delete_by_slug(user_id, slug)
        if filename != "":
            await MediaStorageService().delete(filename)
        await self.session.commit()

    async def update(
        self,
        user_id: int,
        project_id: int,
        project: ProjectsUpdate,
        file: Optional[UploadFile],
    ) -> Projects:

        updated_project = await self.repo.update(user_id, project_id, project)

        if file:
            media_service = MediaStorageService()
            if updated_project.image_url == "":
                updated_project.image_url = await media_service.create(file)
            else:
                await media_service.update(updated_project.image_url, file)
        await self.session.commit()
        return updated_project

    async def update_by_slug(
        self,
        user_id: int,
        project_slug: str,
        project: ProjectsUpdate,
        file: Optional[UploadFile],
    ) -> Projects:
        updated_project = await self.repo.update_by_slug(user_id, project_slug, project)
        if file:
            media_service = MediaStorageService()
            if updated_project.image_url == "":
                updated_project.image_url = await media_service.create(file)
            else:
                await media_service.update(updated_project.image_url, file)

        await self.session.commit()
        return updated_project
