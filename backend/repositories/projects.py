from sqlalchemy import and_, delete, or_, select
from sqlalchemy.orm import joinedload, selectinload

from core.dependencies import SessionDep
from core.exceptions import ProjectNotFound
from models.category import Category
from models.comments import Comments
from models.project import MemberRoles, Projects, ProjectStatus
from slugify import slugify

from schemas.projects import ProjectsReadOne


class ProjectsRepository:
    def __init__(self, session: SessionDep):
        self.session = session

    async def create(self, project: Projects) -> Projects:
        project.slug = await self.generate_unique_slug(project.title)
        self.session.add(project)
        return project

    async def get(self, user_id: int, id: int) -> ProjectsReadOne:
        res = await self.session.execute(
            select(Projects)
            .options(selectinload(Projects.medias))
            .options(selectinload(Projects.member_roles))
            .where(
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

        await self.session.execute(
            select(Comments)
            .where(Comments.project_id == id)
            .order_by(Comments.created_at.desc())
        )
        await self.session.refresh(project, attribute_names=["comments"])
        return project

    async def get_by_slug(self, user_id: int, slug: str) -> ProjectsReadOne:
        res = await self.session.execute(
            select(Projects)
            .options(selectinload(Projects.medias))
            .options(selectinload(Projects.member_roles))
            .where(
                Projects.slug == slug,
                or_(
                    Projects.status == ProjectStatus.PUBLISHED,
                    Projects.owner_id == user_id,
                ),
            )
        )
        project = res.scalar_one_or_none()
        if project is None:
            raise ProjectNotFound(slug)

        await self.session.execute(
            select(Comments)
            .where(Comments.project_id == project.id)
            .order_by(Comments.created_at.desc())
        )
        await self.session.refresh(project, attribute_names=["comments"])
        return project

    async def get_all(self) -> list[Projects]:
        res = await self.session.execute(
            select(Projects)
            .where(
                Projects.status == ProjectStatus.PUBLISHED,
            )
            .order_by(Projects.like_count.desc())
        )
        return res.scalars().all()

    async def get_my(self, user_id: int) -> list[Projects]:
        res = await self.session.execute(
            select(Projects)
            .outerjoin(Projects.member_roles)
            .where(
                or_(
                    Projects.owner_id == user_id,
                    MemberRoles.user_id == user_id,
                )
            )
            .distinct()
            .order_by(Projects.like_count.desc())
        )
        return res.scalars().all()

    async def update(self, user_id: int, project_id: int, data: dict) -> Projects:
        res = await self.session.execute(
            select(Projects)
            .options(selectinload(Projects.medias))
            .options(selectinload(Projects.comments))
            .options(selectinload(Projects.member_roles))
            .where(
                Projects.id == project_id,
                Projects.owner_id == user_id,
            )
        )
        project = res.scalar_one_or_none()
        if project is None:
            raise ProjectNotFound(project_id)

        allowed_fields = {
            "title",
            "description",
            "image_url",
            "category_id",
            "status",
            "slug",
            "practical_benefit",
            "implementation_details",
            "results",
        }

        for key, value in data.items():
            if key in allowed_fields and value is not None:
                setattr(project, key, value)

        return project

    async def update_by_slug(
        self, user_id: int, project_slug: str, data: dict
    ) -> Projects:
        res = await self.session.execute(
            select(Projects)
            .options(selectinload(Projects.medias))
            .options(selectinload(Projects.comments))
            .options(selectinload(Projects.member_roles))

            .where(
                Projects.slug == project_slug,
                Projects.owner_id == user_id,
            )
        )
        project = res.scalar_one_or_none()
        if project is None:
            raise ProjectNotFound(project_slug)

        allowed_fields = {
            "title",
            "description",
            "image_url",
            "category_id",
            "status",
            "slug",
            "practical_benefit",
            "implementation_details",
            "results",
        }

        for key, value in data.items():
            if key in allowed_fields and value is not None:
                setattr(project, key, value)

        return project

    async def delete(self, user_id: int, id: int) -> int:
        res = await self.session.execute(
            delete(Projects)
            .where(
                Projects.id == id,
                Projects.owner_id == user_id,
            )
            .returning(Projects.image_url)
        )

        return res.scalar_one_or_none()

    async def delete_by_slug(self, user_id: int, slug: str) -> int:
        res = await self.session.execute(
            delete(Projects)
            .where(
                Projects.slug == slug,
                Projects.owner_id == user_id,
            )
            .returning(Projects.image_url)
        )

        return res.scalar_one_or_none()

    async def get_by_category(self, category_id: int) -> list[Projects]:
        res = await self.session.execute(
            select(Projects)
            .where(
                Projects.category_id == category_id,
                Projects.status == ProjectStatus.PUBLISHED,
            )
            .order_by(Projects.like_count.desc())
        )
        return res.scalars().all()

    async def get_by_category_by_slug(self, category_slug: int) -> list[Projects]:
        res = await self.session.execute(
            select(Projects)
            .options(joinedload(Projects.category))
            .join(Projects.category)
            .where(Category.slug == category_slug)
            .order_by(Projects.like_count.desc())
        )
        return res.scalars().all()

    async def search_by_title(self, title: str) -> list[Projects]:
        res = await self.session.execute(
            select(Projects)
            .where(
                Projects.title.ilike(f"%{title}%"),
                Projects.status == ProjectStatus.PUBLISHED,
            )
            .order_by(Projects.like_count.desc())
        )
        return res.scalars().all()

    async def get_by_user(self, user_id: int) -> list[Projects]:
        res = await self.session.execute(
            select(Projects)
            .outerjoin(Projects.member_roles)
            .where(
                or_(
                    Projects.owner_id == user_id,
                    and_(
                        MemberRoles.user_id == user_id,
                        Projects.status != ProjectStatus.DRAFT,
                    )
                )
            )
            .distinct()
            .order_by(Projects.like_count.desc())
        )
        return res.scalars().all()

    async def generate_unique_slug(self, title: str) -> str:
        base_slug = slugify(title)
        slug = base_slug
        counter = 1

        while True:
            stmt = select(Projects).where(Projects.slug == slug)
            result = await self.session.execute(stmt)
            existing = result.scalar_one_or_none()

            if not existing:
                break

            counter += 1
            slug = f"{base_slug}-{counter}"

        return slug
