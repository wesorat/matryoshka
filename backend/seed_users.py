import asyncio


from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from core.config import settings
from models.user import User


async def seed_user():
    engine = create_async_engine(settings.DB_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        async with session.begin():
            # избегаем дублирования — ищем через select
            res = await session.execute(select(User.id).where(User.email == 'petr@example.com'))
            if res.first():
                print('User petr@example.com already exists')
                return

            user = User(
                email='petr@example.com',
                hashed_password='not_a_real_hash',
                is_active=True,
                is_superuser=False,
                is_verified=True,
                name='Petr',
                avatar='',
                bio='',
                skills='',
            )
            session.add(user)

    await engine.dispose()


if __name__ == '__main__':
    asyncio.run(seed_user())
