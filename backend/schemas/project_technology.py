from pydantic import BaseModel

from schemas.technology import TechnologyRead


class ProjectTechnologyCreate(BaseModel):
    technology_id: int
    project_id: int

class ProjectTechnologyRead(BaseModel):
    technology: TechnologyRead
    project_id: int

