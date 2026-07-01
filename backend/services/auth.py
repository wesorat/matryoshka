import secrets
import string
import uuid

from fastapi import Depends
from fastapi_users import BaseUserManager, FastAPIUsers, IntegerIDMixin, models
from fastapi_users.authentication import (
    AuthenticationBackend,
    JWTStrategy,
    CookieTransport,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users.password import PasswordHelper

from core.config import settings
from db.session import get_user_db
from models.user import User


class UserManager(IntegerIDMixin, BaseUserManager[User, models.ID]):
    reset_password_token_secret = settings.SECRET
    verification_token_secret = settings.SECRET


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)


cookie_transport = CookieTransport(
    cookie_name="access",
    cookie_max_age=24 * 60 * 60,
    cookie_httponly=True,
    cookie_secure=False,
    cookie_samesite="lax",
    cookie_path="/",
)


def get_jwt_strategy() -> JWTStrategy[models.UP, models.ID]:
    return JWTStrategy(secret=settings.SECRET, lifetime_seconds=15 * 60)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)
current_active_user_optional = fastapi_users.current_user(active=True, optional=True)

password_helper = PasswordHelper()

def generate_secure_random_password_hash(length: int = 64) -> str:

    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()_+-=[]{}|;:,.<>?"
    return hash(''.join(secrets.choice(alphabet) for _ in range(length)))

