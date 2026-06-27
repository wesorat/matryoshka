from typing import Optional

from pydantic import BaseModel

from schemas.projects import ProjectsRead
from schemas.user import Roles, UserRead


class InviteCreate(BaseModel):
    project_id: int
    invitee_id: int
    role_id: int
    message: Optional[str] = ""

class InviteRead(BaseModel):
    id: int
    project: ProjectsRead
    inviter: UserRead
    invitee: UserRead
    role: Roles
    status: Optional[str] = ""
    message: Optional[str] = ""