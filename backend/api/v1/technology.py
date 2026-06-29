from sqlite3 import IntegrityError
from typing import Optional

from fastapi import APIRouter, HTTPException, status

from api.v1.dependencies import CurrentUserDep, TechnologyServiceDep

from core.exceptions import NotOwnProject
from schemas.project_technology import ProjectTechnologyCreate, ProjectTechnologyRead
from schemas.technology import TechnologyRead

technology_router = APIRouter(
    prefix="/technology",
    tags=["Technology"],
)


@technology_router.get("/", summary="Get all technology", response_model=list[TechnologyRead])
async def get_all(
    service: TechnologyServiceDep,
    count: Optional[int] = 300
):
    technologies = await service.get_all_technology(count)
    return technologies



@technology_router.post("/", summary="Add new technology for project", response_model=ProjectTechnologyRead)
async def add(
    service: TechnologyServiceDep,
    user: CurrentUserDep,
    project_technology: ProjectTechnologyCreate,
):
    try:
        user_id = user.id
        project_technology = await service.create(user_id, project_technology)
        return project_technology
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except NotOwnProject as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except IntegrityError as e:
        if "UNIQUE" in str(e.orig) or "duplicate" in str(e.orig).lower():
            raise HTTPException(
                status_code=409, detail=f"Project_technology {project_technology} уже существует"
            )
        else:
            raise e


@technology_router.delete("/", summary="Remove technology for project")
async def remove(
    service: TechnologyServiceDep,
    user: CurrentUserDep,
    project_technology: ProjectTechnologyCreate,
):
    try:
        user_id = user.id
        count = await service.remove(user_id, project_technology)
        return {"count_deleted": count}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except NotOwnProject as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except IntegrityError as e:
        if "UNIQUE" in str(e.orig) or "duplicate" in str(e.orig).lower():
            raise HTTPException(
                status_code=409, detail=f"Project_technology {project_technology} уже существует"
            )
        else:
            raise e

