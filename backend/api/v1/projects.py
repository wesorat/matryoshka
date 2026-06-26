from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.exc import IntegrityError


from api.v1.dependencies import (
    CurrentUserDep,
    CurrentUserOptionalDep,
    MembersServiceDep,
    ProjectServiceDep,
)
from core.config import FILES_DIR
from core.exceptions import NotCorrectEmail, NotOwnProject, ProjectNotFound
from models.user import User
from schemas.projects import (
    ProjectsCreate,
    ProjectsRead,
    ProjectsReadOne,
    ProjectsUpdate,
)
from schemas.user import MemberRead, MemberReadCreated, NewMemberAdd
from services.storage import storage

project_router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@project_router.post("/", response_model=ProjectsRead)
async def create_project(
    current_user: CurrentUserDep,
    service: ProjectServiceDep,
    project: ProjectsCreate = Depends(),
    file: Optional[UploadFile] = File(None),
):
    try:
        created_project = await service.create(project, current_user.id, file)
        return created_project
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@project_router.get("/", response_model=list[ProjectsRead])
async def get_projects(service: ProjectServiceDep):
    projects = await service.get_all()
    return projects


@project_router.get("/my", response_model=list[ProjectsRead])
async def get_my_projects(current_user: CurrentUserDep, service: ProjectServiceDep):
    projects = await service.get_my(current_user.id)
    return projects


@project_router.get("/{project_id:int}", response_model=ProjectsReadOne)
async def get_project(
    project_id: int, current_user: CurrentUserOptionalDep, service: ProjectServiceDep
):
    try:
        user_id = current_user.id if current_user else 0
        project = await service.get(user_id, project_id)
        return project
    except ProjectNotFound:
        raise HTTPException(
            status_code=404, detail=f"Project id {project_id} not found"
        )


@project_router.get("/{project_slug:str}", response_model=ProjectsReadOne)
async def get_project_slug(
    project_slug: str, current_user: CurrentUserOptionalDep, service: ProjectServiceDep
):
    try:
        user_id = current_user.id if current_user else 0
        project = await service.get_by_slug(user_id, project_slug)
        return project
    except ProjectNotFound:
        raise HTTPException(
            status_code=404, detail=f"Project slug {project_slug} not found"
        )

@project_router.post("/{project_id:int}/members", response_model=MemberReadCreated)
async def add_project_member(
    project_id: int, member: NewMemberAdd, current_user: CurrentUserDep, service: MembersServiceDep
):
    try:
        user_id = current_user.id
        member = await service.create(user_id, project_id, member)
        return member
    except ProjectNotFound:
        raise HTTPException(
            status_code=404, detail=f"Project id {project_id} not found"
        )
    except NotOwnProject:
        raise HTTPException(
            status_code=403, detail=f"Project id {project_id} is not yours"
        )
    except NotCorrectEmail:
        raise HTTPException(
            status_code=404, detail=f"Member id {member.id} has another email"
        )
    except IntegrityError as e:
        if "UNIQUE" in str(e.orig) or "duplicate" in str(e.orig).lower():
            raise HTTPException(
                status_code=409,
                detail=f"Member roles user_id={user_id} project_id={project_id} уже существует",
            )
        else:
            raise e

@project_router.delete("/{project_id:int}/members")
async def remove_project_member(
    project_id: int, email: str, current_user: CurrentUserDep, service: MembersServiceDep
):
    try:
        user_id = current_user.id
        count = await service.remove_member(user_id, project_id, email)
        return {"count deleted": count}
    except ProjectNotFound:
        raise HTTPException(
            status_code=404, detail=f"Project id {project_id} not found"
        )
    except NotOwnProject:
        raise HTTPException(
            status_code=403, detail=f"Project id {project_id} is not yours"
        )



@project_router.get("/category/{category_id:int}", response_model=list[ProjectsRead])
async def get_projects_by_category(category_id: int, service: ProjectServiceDep):
    projects = await service.get_projects_by_category(category_id)
    return projects


@project_router.get("/category/{category_slug:str}", response_model=list[ProjectsRead])
async def get_projects_by_category_slug(category_slug: str, service: ProjectServiceDep):
    projects = await service.get_projects_by_category_by_slug(category_slug)
    return projects


@project_router.get(
    "/search/{title}",
    summary="Search project by title",
    response_model=list[ProjectsRead],
)
async def search_projects(title: str, service: ProjectServiceDep):
    projects = await service.search_by_title(title)
    return projects


@project_router.patch("/{project_id:int}", response_model=ProjectsReadOne)
async def update_project(
    project_id: int,
    current_user: CurrentUserDep,
    service: ProjectServiceDep,
    project: ProjectsUpdate = Depends(),
    file: Optional[UploadFile] = File(None),
):
    try:
        updated_project = await service.update(
            current_user.id, project_id, project.model_dump(exclude_unset=True), file
        )
        return updated_project
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@project_router.patch("/{project_slug:str}", response_model=ProjectsReadOne)
async def update_project(
    project_slug: str,
    current_user: CurrentUserDep,
    service: ProjectServiceDep,
    project: ProjectsUpdate = Depends(),
    file: Optional[UploadFile] = File(None),
):
    try:
        updated_project = await service.update_by_slug(
            current_user.id, project_slug, project.model_dump(exclude_unset=True), file
        )
        return updated_project
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_slug} not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@project_router.delete("/{project_id:int}")
async def delete_project(
    project_id: int, service: ProjectServiceDep, current_user: CurrentUserDep
):
    try:
        await service.delete(current_user.id, project_id)
        return {"status": "deleted"}
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")


@project_router.delete("/{project_slug:str}")
async def delete_project(
    project_slug: str, current_user: CurrentUserDep, service: ProjectServiceDep
):
    try:
        await service.delete_by_slug(current_user.id, project_slug)
        return {"status": "deleted"}
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_slug} not found")

