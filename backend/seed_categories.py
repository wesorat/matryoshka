import asyncio

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from core.config import settings
from db.base import Base
from models.category import Category


async def seed_categories():
    engine = create_async_engine(settings.DB_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        async with session.begin():
            categories = [
                Category(name='Робототехника', slug='robo'),
                Category(name='Физика', slug='fizzika'),
                Category(name='Беспилотные технологии', slug='bpla'),
                Category(name='Биология', slug='bio'),
            ]
            session.add_all(categories)

    await engine.dispose()


if __name__ == '__main__':
    asyncio.run(seed_categories())
