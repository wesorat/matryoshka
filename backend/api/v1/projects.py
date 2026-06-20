
from fastapi import APIRouter, Depends, HTTPException

from api.v1.dependencies import CurrentUserDep, ProjectServiceDep
from core.exceptions import ProjectNotFound
from models.user import User
from schemas.projects import (ProjectsCreate, ProjectsRead, ProjectsUpdate,
                            ProjectUpdateStatus)

project_router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@project_router.post("/")
async def create_project(
    project: ProjectsCreate, current_user: CurrentUserDep, service: ProjectServiceDep
):
    created_project = await service.create(project, current_user.id)
    return created_project


@project_router.get("/")
async def get_projects(current_user: CurrentUserDep, service: ProjectServiceDep):
    projects = await service.get_all(current_user.id)
    return projects


@project_router.get("/my/")
async def get_my_projects(current_user: CurrentUserDep, service: ProjectServiceDep):
    projects = await service.get_all(current_user.id)
    return projects


@project_router.get("/{project_id}")
async def get_project(
    project_id: int, current_user: CurrentUserDep, service: ProjectServiceDep
):
    try:
        project = await service.get(current_user.id, project_id)
        return project
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")


@project_router.get("/category/{category_id}")
async def get_projects_by_category(
    category_id: int, current_user: CurrentUserDep, service: ProjectServiceDep
):
    projects = await service.get_projects_by_category(current_user.id, category_id)
    return projects


@project_router.get("/search/", summary="Search project by title")
async def search_projects(
    title: str, current_user: CurrentUserDep, service: ProjectServiceDep
):
    projects = await service.search_by_title(current_user.id, title)
    return projects


@project_router.patch("/{project_id}/status")
async def update_project_status(
    project_id: int,
    project: ProjectUpdateStatus,
    current_user: CurrentUserDep,
    service: ProjectServiceDep,
):
    try:
        updated_project = await service.update_status(
            current_user.id, project_id, project.status
        )
        return updated_project
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")


@project_router.patch("/{project_id}")
async def update_project(
    project_id: int,
    project: ProjectsUpdate,
    current_user: CurrentUserDep,
    service: ProjectServiceDep,
):
    try:
        updated_project = await service.update(
            current_user.id, project_id, project.model_dump(exclude_unset=True)
        )
        return updated_project
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")


@project_router.delete("/{project_id}")
async def delete_project(
    project_id: int, current_user: CurrentUserDep, service: ProjectServiceDep
):
    try:
        count = await service.delete(current_user.id, project_id)
        return {"count_deleted": count}
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
