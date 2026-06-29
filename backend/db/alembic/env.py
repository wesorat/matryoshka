import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import URL, engine_from_config, pool

from db.base import Base
from models.category import Category
from models.project import MemberRoles, Projects, Role, ProjectStatus
from models.user import User
from models.likes import Likes
from models.comments import Comments
from models.media import Media
from models.invites import ProjectInvite, InviteStatus
from models.university import University
from models.technology import Technology, ProjectTechnology


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_database_url() -> str:
    required_vars = ("DB_USER", "DB_PASSWORD", "DB_HOST", "DB_PORT", "DB_DATABASE")
    missing_vars = [name for name in required_vars if not os.environ.get(name)]
    if missing_vars:
        names = ", ".join(missing_vars)
        raise RuntimeError(f"Missing required Alembic environment variables: {names}")

    return URL.create(
        drivername="postgresql+psycopg2",
        username=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        host=os.environ["DB_HOST"],
        port=int(os.environ["DB_PORT"]),
        database=os.environ["DB_DATABASE"],
    ).render_as_string(hide_password=False)


# Alembic stores this through ConfigParser, where percent signs are interpolation
# markers. URL-encoded passwords may contain %, so escape them before setting.
config.set_main_option("sqlalchemy.url", get_database_url().replace("%", "%%"))


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
