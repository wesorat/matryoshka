import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from core.config import settings
from models.category import Category
from models.project import Projects, ProjectStatus
from models.user import User


async def seed_projects():
    engine = create_async_engine(settings.DB_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        async with session.begin():
            res = await session.execute(select(Category))
            categories = res.scalars().all()

            # Получаем id тестового пользователя (если нет, он должен быть создан seed_users.py)
            user_row = await session.execute(
                select(User.id).where(User.email == 'petr@example.com').limit(1)
            )
            row = user_row.first()
            owner_id = row[0] if row is not None else None

            if owner_id is None:
                raise RuntimeError('Test user petr@example.com not found — run seed_users.py first')

            created = []
            for cat in categories:
                for i in (1, 2):
                    proj = Projects(
                        title=f"{cat.name} — Демопроект {i}",
                        description=f"Описание демопроекта {i} для категории {cat.name}",
                        image_url=f"https://placehold.co/420x240?text={cat.slug}+{i}",
                        owner_id=owner_id,
                        category_id=cat.id,
                        status=ProjectStatus.PUBLISHED,
                    )
                    session.add(proj)
                    created.append(proj)

    await engine.dispose()


if __name__ == '__main__':
    asyncio.run(seed_projects())
