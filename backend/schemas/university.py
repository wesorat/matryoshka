from pydantic import BaseModel


class UniversityRead(BaseModel):
    id: int
    name: str