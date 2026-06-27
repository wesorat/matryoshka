from typing import Optional

from pydantic import BaseModel

from schemas.projects import ProjectsRead
from schemas.user import UserRead


class InviteCreate(BaseModel):
    project_id: int
    invitee_id: int
    role: Optional[str] = ""
    message: Optional[str] = ""

class InviteRead(BaseModel):
    id: int
    project: ProjectsRead
    inviter: UserRead
    invitee: UserRead
    role: Optional[str] = ""
    status: Optional[str] = ""
    message: Optional[str] = ""