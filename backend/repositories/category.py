from sqlalchemy import delete, func, select

from core.dependencies import SessionDep
from models.category import Category
from models.project import ProjectStatus, Projects


class CategoryRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def create(self, category: Category) -> Category:
        self.session.add(category)
        return category

    async def get(self, id: int) -> Category:
        return await self.session.get(Category, id)

    async def get_all(self, count: int = 15, has_projects: bool = False) -> list[dict]:
        likes_subquery = (
            select(
                Projects.category_id,
                func.coalesce(func.sum(Projects.like_count), 0).label("total_likes")
            )
            .where(Projects.status != ProjectStatus.DRAFT)
            .group_by(Projects.category_id)
            .subquery()
        )

        query = select(
            Category,
            func.coalesce(likes_subquery.c.total_likes, 0).label("total_likes")
        ).outerjoin(
            likes_subquery, Category.id == likes_subquery.c.category_id
        )

        if has_projects:
            projects_count = (
                select(
                    Projects.category_id,
                    func.count().label("cnt")
                )
                .where(Projects.status != ProjectStatus.DRAFT)
                .group_by(Projects.category_id)
                .subquery()
            )
            query = query.join(
                projects_count,
                Category.id == projects_count.c.category_id
            )

        query = query.order_by(
            func.coalesce(likes_subquery.c.total_likes, 0).desc()
        ).limit(count)

        res = await self.session.execute(query)
        result = []
        for category, total_likes in res.all():
            result.append({**category.__dict__, "total_likes": total_likes})
        return result


    async def delete(self, id: int) -> int:
        res = await self.session.execute(delete(Category).where(Category.id == id))
        return res.rowcount
