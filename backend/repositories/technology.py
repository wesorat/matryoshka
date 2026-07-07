
from sqlalchemy import delete, select, insert
from sqlalchemy.orm import noload

from core.dependencies import SessionDep

from models.project import MemberRoles
from models.technology import ProjectTechnology, Technology
from models.user import User


class TechnologyRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def add_project_technology(self, project_technology: ProjectTechnology) -> ProjectTechnology:
        self.session.add(project_technology)

        return project_technology

    async def add_project_technologies(self, project_id: int, technologies_id: list[int]):
        await self.session.execute(
            insert(ProjectTechnology).values([
                {"project_id": project_id, "technology_id": tech_id}
                for tech_id in technologies_id
            ])
        )


    async def delete_project_technologies(self, project_id: int, technologies_id: list[int]) -> int:
        res = await self.session.execute(
                delete(ProjectTechnology).where(
                ProjectTechnology.project_id == project_id,
                ProjectTechnology.technology_id.in_(technologies_id)
                ))
        return res.rowcount


    async def get_technology(self, technology_id: int) -> Technology:
        return await self.session.get(Technology, technology_id)

    async def get_technology_all(self, count: int = 300) -> list[Technology]:
        res = await self.session.execute(select(Technology).order_by(Technology.name).limit(count))
        return res.scalars().all()

    async def remove_project_technology(self, project_id: int, technology_id: int) -> int:
        res = await self.session.execute(delete(ProjectTechnology).where(ProjectTechnology.project_id == project_id, ProjectTechnology.technology_id == technology_id))
        return res.rowcount



