from pydantic import BaseModel





class TechnologyRead(BaseModel):
    id: int
    name: str



class TechnologyReadOne(BaseModel):
    id: int
    name: str
    # project_technology: list[ProjectTechnologyRead]









