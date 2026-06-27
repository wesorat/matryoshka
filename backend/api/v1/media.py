from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse

from api.v1.dependencies import (
    CurrentUserDep,
    MediaServiceDep,
    MediaStroageServiceDep,
    get_mediaCreate_from_form,
)

from schemas.media import MediaCreate, MediaRead

media_router = APIRouter(
    prefix="/media",
    tags=["Media"],
)


@media_router.post("/", summary="Create media", response_model=MediaRead)
async def create(
    media_service: MediaServiceDep,
    user: CurrentUserDep,
    file: UploadFile,
    media: MediaCreate = Depends(get_mediaCreate_from_form),
):
    try:
        user_id = user.id
        media = await media_service.create(user_id, file, media)
        return media
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@media_router.get("/uploads/{filename}")
async def get_file(
    filename: str,
    media_service: MediaStroageServiceDep,
):
    try:
        file_path = await media_service.get_filepath(filename)
        return FileResponse(
            path=file_path,
            filename=filename,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@media_router.delete("/", summary="Delete media")
async def delete(
    media_service: MediaServiceDep, user: CurrentUserDep, project_id: int, media_id: int
):
    try:
        await media_service.delete(user.id, project_id, media_id)
        return {"count_deleted": 1}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
