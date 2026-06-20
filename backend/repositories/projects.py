from sqlalchemy import delete, or_, select

from core.dependencies import SessionDep
from core.exceptions import ProjectNotFound
from models.project import Projects, ProjectStatus


class ProjectsRepository:
    def __init__(self, session: SessionDep):
        self.session = session

    async def create(self, project: Projects) -> Projects:
        self.session.add(project)
        return project

    async def get(self, user_id: int, id: int) -> Projects:
        res = await self.session.execute(
            select(Projects).where(
                Projects.id == id,
                or_(
                    Projects.status == ProjectStatus.PUBLISHED,
                    Projects.owner_id == user_id,
                ),
            )
        )
        project = res.scalar_one_or_none()
        if project is None:
            raise ProjectNotFound(id)
        return project

    async def get_all(self, user_id: int) -> list[Projects]:
        res = await self.session.execute(
            select(Projects).where(
                or_(
                    Projects.status == ProjectStatus.PUBLISHED,
                    Projects.owner_id == user_id,
                )
            )
        )
        return res.scalars().all()

    async def update(self, user_id: int, project_id: int, data: dict) -> Projects:
        res = await self.session.execute(
            select(Projects).where(
                Projects.id == project_id,
                Projects.owner_id == user_id,
            )
        )
        project = res.scalar_one_or_none()
        if project is None:
            raise ProjectNotFound(project_id)

        allowed_fields = {"title", "description", "image_url", "category_id", "status"}

        for key, value in data.items():
            if key in allowed_fields and value is not None:
                setattr(project, key, value)

        return project

    async def delete(self, user_id: int, id: int) -> int:
        res = await self.session.execute(
            delete(Projects).where(
                Projects.id == id,
                Projects.owner_id == user_id,
            )
        )

        return res.rowcount

    async def get_by_category(self, user_id: int, category_id: int) -> list[Projects]:
        res = await self.session.execute(
            select(Projects).where(
                Projects.category_id == category_id,
                or_(
                    Projects.status == ProjectStatus.PUBLISHED,
                    Projects.owner_id == user_id,
                ),
            )
        )
        return res.scalars().all()

    async def search_by_title(self, user_id: int, title: str) -> list[Projects]:
        res = await self.session.execute(
            select(Projects).where(
                Projects.title.ilike(f"%{title}%"),
                or_(
                    Projects.status == ProjectStatus.PUBLISHED,
                    Projects.owner_id == user_id,
                ),
            )
        )
        return res.scalars().all()

    async def update_status(
        self, user_id: int, id: int, status: ProjectStatus
    ) -> Projects:
        res = await self.session.execute(
            select(Projects).where(
                Projects.id == id,
                Projects.owner_id == user_id,
            )
        )
        project = res.scalar_one_or_none()
        if project is None:
            raise ProjectNotFound(id)

        project.status = status
        return project
