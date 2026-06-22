from typing import List

from core.dependencies import SessionDep
from core.exceptions import ProjectNotFound
from models.project import Projects, ProjectStatus
from repositories.projects import ProjectsRepository
from schemas.projects import ProjectsCreate, ProjectsUpdate


class ProjectService:
    def __init__(self, session: SessionDep):
        self.session = session
        self.repo = ProjectsRepository(session)

    async def create(self, project: ProjectsCreate, user_id: int) -> Projects:
        project_dict = project.model_dump()

        created_project = Projects(**project_dict)
        created_project.owner_id = user_id

        await self.repo.create(created_project)
        await self.session.commit()

        return created_project

    async def get(self, user_id: int, project_id: int) -> Projects:
        return await self.repo.get(user_id, project_id)

    async def get_by_slug(self, user_id: int, slug: str) -> Projects:
        return await self.repo.get_by_slug(user_id, slug)

    async def get_all(self) -> List[Projects]:
        return await self.repo.get_all()

    async def get_my(self, user_id: int) -> List[Projects]:
        return await self.repo.get_my(user_id)

    async def get_projects_by_category(
        self, category_id: int
    ) -> List[Projects]:
        return await self.repo.get_by_category(category_id)

    async def get_projects_by_category_by_slug(
        self, slug: str
    ) -> List[Projects]:

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

    async def delete(self, user_id: int, project_id: int) -> int:
        count = await self.repo.delete(user_id, project_id)
        if count == 0:
            raise ProjectNotFound(project_id)
        await self.session.commit()
        return count

    async def delete_by_slug(self, user_id: int, slug: str) -> int:
        count = await self.repo.delete_by_slug(user_id, slug)
        if count == 0:
            raise ProjectNotFound(slug)
        await self.session.commit()

        return count

    async def update(
        self, user_id: int, project_id: int, project: ProjectsUpdate
    ) -> Projects:
        updated_project = await self.repo.update(user_id, project_id, project)
        await self.session.commit()
        return updated_project

    async def update_by_slug(
        self, user_id: int, project_slug: str, project: ProjectsUpdate
    ) -> Projects:
        updated_project = await self.repo.update_by_slug(user_id, project_slug, project)
        await self.session.commit()
        return updated_project
