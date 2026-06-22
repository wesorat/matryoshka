from core.dependencies import SessionDep
from models.category import Category
from repositories.category import CategoryRepository
from schemas.category import CategoryCreate, CategoryRead
from slugify import slugify


class CategoryService:
    def __init__(self, session: SessionDep):
        self.session = session
        self.repo = CategoryRepository(session=session)

    async def create(self, category: CategoryCreate) -> Category:

        category_dict = category.model_dump()

        created_category = Category(**category_dict)

        created_category.slug = slugify(category.name)

        await self.repo.create(created_category)
        await self.session.commit()

        return created_category

    async def get(self, id: int) -> Category:
        return await self.repo.get(id)

    async def get_all(self) -> list[Category]:
        return await self.repo.get_all()

    async def delete(self, id: int) -> int:
        count = await self.repo.delete(id)
        await self.session.commit()
        return count
