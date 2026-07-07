
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
        await self.session.flush()
        await self.session.refresh(project_technology,
            attribute_names=['project', 'technology']
        )
        await self.session.commit()

        return created_project_technology

    async def create_all(self, owner_id: int, project_id: int, technologies_id: list[int]):
        project = await ProjectService(self.session).get(owner_id, project_id)
        if project is None:
            raise ProjectNotFound(project_id)
        if project.owner.id != owner_id:
            raise NotOwnProject(owner_id)


        await self.repo.add_project_technologies(project_id, technologies_id)
        await self.session.commit()


    async def delete_all(self, owner_id: int, project_id: int, technologies_id: list[int]) -> int:
        project = await ProjectService(self.session).get(owner_id, project_id)
        if project is None:
            raise ProjectNotFound(project_id)
        if project.owner.id != owner_id:
            raise NotOwnProject(owner_id)


        count = await self.repo.delete_project_technologies(project_id, technologies_id)
        await self.session.flush()
        await self.session.commit()

        return count

    async def remove(self, owner_id: int, project_technology: ProjectTechnologyCreate) -> int:
        project = await ProjectService(self.session).get(owner_id, project_technology.project_id)
        if project is None:
            raise ProjectNotFound(project_technology.project_id)
        if project.owner.id != owner_id:
            raise NotOwnProject(owner_id)


        count = await self.repo.remove_project_technology(project_technology.project_id, project_technology.technology_id)
        await self.session.commit()
        return count



