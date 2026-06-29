
from sqlalchemy import delete, select

from core.dependencies import SessionDep

from models.project import MemberRoles
from models.technology import ProjectTechnology, Technology
from models.user import User


class TechnologyRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def add_project_technology(self, project_technology: ProjectTechnology) -> ProjectTechnology:
        self.session.add(project_technology)
        await self.session.flush()
        await self.session.refresh(project_technology,
        attribute_names=['project', 'technology']
    )
        return project_technology

    async def get_technology(self, technology_id: int) -> Technology:
        return await self.session.get(Technology, technology_id)

    async def get_technology_all(self, count: int = 300) -> list[Technology]:
        res = await self.session.execute(select(Technology).order_by(Technology.name).limit(count))
        return res.scalars().all()

    async def remove_project_technology(self, project_id: int, technology_id: int) -> int:
        res = await self.session.execute(delete(ProjectTechnology).where(ProjectTechnology.project_id == project_id, ProjectTechnology.technology_id == technology_id))
        return res.rowcount



