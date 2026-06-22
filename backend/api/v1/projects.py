
import os
from pathlib import Path
from typing import Optional

from anyio import current_effective_deadline
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from api.v1.dependencies import CurrentUserDep, CurrentUserOptionalDep, ProjectServiceDep
from core.config import FILES_DIR
from core.exceptions import ProjectNotFound
from models.user import User
from schemas.projects import (ProjectsCreate, ProjectsRead, ProjectsUpdate,
                            ProjectUpdateStatus)
from services.storage import storage

project_router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@project_router.post("/", response_model=ProjectsRead)
async def create_project(
    current_user: CurrentUserDep, service: ProjectServiceDep, project: ProjectsCreate = Depends(), file: Optional[UploadFile] = File(None)
):

    created_project = await service.create(project, current_user.id, file)
    return created_project



@project_router.get("/", response_model=list[ProjectsRead])
async def get_projects(service: ProjectServiceDep):
    projects = await service.get_all()
    return projects

@project_router.get("/uploads/{filepath}")
async def get_file(filepath: str):
    file_path = storage._full_path(filepath)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Изображение не найдено")

    return FileResponse(
        path=file_path,
        filename=filepath
    )

@project_router.get("/my", response_model=list[ProjectsRead])
async def get_my_projects(current_user: CurrentUserDep, service: ProjectServiceDep):
    projects = await service.get_my(current_user.id)
    return projects

@project_router.get("/{project_id:int}", response_model=ProjectsRead)
async def get_project(
    project_id: int, current_user: CurrentUserOptionalDep, service: ProjectServiceDep
):
    try:
        user_id = current_user.id if current_user else 0
        project = await service.get(user_id, project_id)
        return project
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project id {project_id} not found")



@project_router.get("/{project_slug:str}", response_model=ProjectsRead)
async def get_project_slug(
    project_slug: str, current_user: CurrentUserOptionalDep, service: ProjectServiceDep
):
    try:
        user_id = current_user.id if current_user else 0
        project = await service.get_by_slug(user_id, project_slug)
        return project
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project slug {project_slug} not found")




@project_router.get("/category/{category_id:int}", response_model=list[ProjectsRead])
async def get_projects_by_category(
    category_id: int, service: ProjectServiceDep
):
    projects = await service.get_projects_by_category(category_id)
    return projects


@project_router.get("/category/{category_slug:str}", response_model=list[ProjectsRead])
async def get_projects_by_category_slug(
    category_slug: str, service: ProjectServiceDep
):
    projects = await service.get_projects_by_category_by_slug(category_slug)
    return projects


@project_router.get("/search/{title}", summary="Search project by title", response_model=list[ProjectsRead])
async def search_projects(
    title: str, service: ProjectServiceDep
):
    projects = await service.search_by_title(title)
    return projects


@project_router.patch("/{project_id:int}/status", response_model=ProjectsRead)
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

@project_router.patch("/{project_slug:str}/status", response_model=ProjectsRead)
async def update_project_status(
    project_slug: str,
    project: ProjectUpdateStatus,
    current_user: CurrentUserDep,
    service: ProjectServiceDep,
):
    try:
        updated_project = await service.update_status(
            current_user.id, project_slug, project.status
        )
        return updated_project
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_slug} not found")



@project_router.patch("/{project_id:int}", response_model=ProjectsRead)
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

@project_router.patch("/{project_slug:str}", response_model=ProjectsRead)
async def update_project(
    project_slug: str,
    project: ProjectsUpdate,
    current_user: CurrentUserDep,
    service: ProjectServiceDep,
):
    try:
        updated_project = await service.update_by_slug(
            current_user.id, project_slug, project.model_dump(exclude_unset=True)
        )
        return updated_project
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_slug} not found")


@project_router.delete("/{project_id:int}")
async def delete_project(
    project_id: int, current_user: CurrentUserDep, service: ProjectServiceDep
):
    try:
        count = await service.delete(current_user.id, project_id)
        return {"count_deleted": count}
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")


@project_router.delete("/{project_slug:str}")
async def delete_project(
    project_slug: str, current_user: CurrentUserDep, service: ProjectServiceDep
):
    try:
        count = await service.delete_by_slug(current_user.id, project_slug)
        return {"count_deleted": count}
    except ProjectNotFound:
        raise HTTPException(status_code=404, detail=f"Project {project_slug} not found")
