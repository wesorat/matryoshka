import email

from fastapi_users import password
from fastapi_users.db import SQLAlchemyUserDatabase

from core.dependencies import SessionDep
from core.exceptions import NotCorrectEmail, NotOwnProject, ProjectNotFound
from models.likes import Likes
from models.project import MemberRoles
from models.user import User
from repositories.likes import LikesRepository
from repositories.members import MembersRepository
from schemas.user import NewMemberAdd, UserCreate
from services.auth import UserManager, generate_secure_random_password_hash, get_user_manager
from services.projects import ProjectService



class MembersService:
    def __init__(self, session: SessionDep):
        self.session = session
        self.repo = MembersRepository(session=session)

    async def create(self, user_id: int, project_id: int, member: NewMemberAdd) -> MemberRoles:
        project = await ProjectService(self.session).get(user_id, project_id)
        if project is None:
            raise ProjectNotFound(project_id)
        if project.owner.id != user_id:
            raise NotOwnProject(user_id)

        user = await self.repo.get_user(member.id)
        if user is None:
            user_create = UserCreate(name=member.name, email=member.email, password="123")
            user_db = SQLAlchemyUserDatabase(self.session, User)

            user_manager = UserManager(user_db)
            user = await user_manager.create(user_create, safe=False)
            user.is_active=False
            await self.session.flush()


        if user.email != member.email:
            raise NotCorrectEmail(user_id)

        created_member = MemberRoles(user_id=user.id, project_id=project_id, role=member.role)
        created_member = await self.repo.add_member(created_member)

        await self.session.commit()

        return created_member

    async def remove_member(self, user_id: int, project_id: int, member_id: int) -> None:
        project = await ProjectService(self.session).get(user_id, project_id)
        if project is None:
            raise ProjectNotFound(project_id)
        if project.owner.id != user_id:
            raise NotOwnProject(user_id)

        count = await self.repo.remove_member(member_id, project_id)
        await self.session.commit()
        return count
