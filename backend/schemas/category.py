from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str


class CategoryRead(BaseModel):
    id: int
    name: str
    slug: str


class CategoryReadWithLikes(BaseModel):
    id: int
    name: str
    slug: str
    total_likes: int

