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

    async def get_all(self, user_id: int) -> List[Projects]:
        return await self.repo.get_all(user_id)

    async def get_projects_by_category(
        self, user_id: int, category_id: int
    ) -> List[Projects]:
        return await self.repo.get_by_category(user_id, category_id)

    async def search_by_title(self, user_id: int, title: str) -> List[Projects]:
        if not title or len(title.strip()) == 1:
            return []
        return await self.repo.search_by_title(user_id, title.strip())

    async def update_status(
        self, user_id: int, project_id: int, status: ProjectStatus
    ) -> Projects:
        project = await self.repo.update_status(user_id, project_id, status)
        await self.session.commit()
        return project

    async def delete(self, user_id: int, project_id: int) -> int:
        count = await self.repo.delete(user_id, project_id)
        if count == 0:
            raise ProjectNotFound(project_id)
        return count

    async def update(
        self, user_id: int, project_id: int, project: ProjectsUpdate
    ) -> Projects:
        updated_project = await self.repo.update(user_id, project_id, project)
        await self.session.commit()
        return updated_project
