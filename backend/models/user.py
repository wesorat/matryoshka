from fastapi_users.db import SQLAlchemyBaseUserTableUUID

from db.base import Base


class User(SQLAlchemyBaseUserTableUUID, Base): ...
