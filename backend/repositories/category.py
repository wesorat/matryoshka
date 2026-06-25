from sqlalchemy import delete, func, select
from sqlalchemy.orm import joinedload

from core.dependencies import SessionDep
from models.category import Category
from models.project import Projects


class CategoryRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def create(self, category: Category) -> Category:
        self.session.add(category)
        return category

    async def get(self, id: int) -> Category:
        return await self.session.get(Category, id)

    async def get_all(self, count: int = 15) -> list[dict]:
        res = await self.session.execute(
            select(Category, func.sum(Projects.like_count).label("total_likes"))
            .join(Projects, Category.id == Projects.category_id)
            .group_by(Category.id)
            .order_by(func.sum(Projects.like_count).desc())
            .limit(limit=count)
        )
        result = []
        for category, total_likes in res.all():
            result.append({**category.__dict__, "total_likes": total_likes})
        return result

    async def delete(self, id: int) -> int:
        res = await self.session.execute(delete(Category).where(Category.id == id))
        return res.rowcount
