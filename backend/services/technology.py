
from sqlalchemy.util import portable_instancemethod

from core.dependencies import SessionDep
from core.exceptions import NotOwnProject, ProjectNotFound, TechnologyNotFound, UserNotFound
from models.project import MemberRoles
from models.technology import ProjectTechnology, Technology

from repositories.technology import TechnologyRepository
from schemas.project_technology import ProjectTechnologyCreate
from schemas.user import NewMemberAdd, UserCreate
from services.projects import ProjectService



class TechnologyService:
    def __init__(self, session: SessionDep):
        self.session = session
        self.repo = TechnologyRepository(session=session)

    async def get_all_technology(self, count: int = 300) -> list[Technology]:
        return await self.repo.get_technology_all(count)

    async def create(self, owner_id: int, project_technology: ProjectTechnologyCreate) -> ProjectTechnology:
        project = await ProjectService(self.session).get(owner_id, project_technology.project_id)
        if project is None:
            raise ProjectNotFound(project_technology.project_id)
        if project.owner.id != owner_id:
            raise NotOwnProject(owner_id)

        technology = await self.repo.get_technology(project_technology.technology_id)
        if technology is None:
            raise TechnologyNotFound(project_technology.project_id)

        project_technology_dict = project_technology.model_dump()


        created_project_technology = ProjectTechnology(**project_technology_dict)
        created_project_technology = await self.repo.add_project_technology(created_project_technology)
        await self.session.commit()

        return created_project_technology

    async def remove(self, owner_id: int, project_technology: ProjectTechnologyCreate) -> int:
        project = await ProjectService(self.session).get(owner_id, project_technology.project_id)
        if project is None:
            raise ProjectNotFound(project_technology.project_id)
        if project.owner.id != owner_id:
            raise NotOwnProject(owner_id)


        count = await self.repo.remove_project_technology(project_technology.project_id, project_technology.technology_id)
        await self.session.commit()
        return count



