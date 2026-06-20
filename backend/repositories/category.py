from sqlalchemy import delete, select

from core.dependencies import SessionDep
from models.category import Category


class CategoryRepository:

    def __init__(self, session: SessionDep):
        self.session = session

    async def create(self, category: Category) -> Category:
        self.session.add(category)
        return category

    async def get(self, id: int) -> Category:
        return await self.session.get(Category, id)

    async def get_all(self) -> list[Category]:
        res = await self.session.execute(select(Category))
        return res.scalars().all()

    async def delete(self, id: int) -> int:
        res = await self.session.execute(delete(Category).where(Category.id == id))
        return res.rowcount
