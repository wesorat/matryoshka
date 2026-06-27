from fastapi import APIRouter, HTTPException, status

from api.v1.dependencies import InviteServiceDep, CurrentUserDep
from core.exceptions import NotOwnProject
from schemas.invites import InviteCreate, InviteRead

invites_router = APIRouter(prefix="/invites", tags=["invites"])


@invites_router.post("/", response_model=InviteRead, status_code=status.HTTP_201_CREATED)
async def create_invite(
    invite: InviteCreate,
    service: InviteServiceDep,
    user: CurrentUserDep
):
    try:
        user_id = user.id

        created_invite = await service.create_invite(user_id, invite)
        return created_invite
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except NotOwnProject as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@invites_router.get("/", response_model=list[InviteRead])
async def get_my_invites(
    service: InviteServiceDep,
    current_user: CurrentUserDep,
    sent: bool = False
):
    if sent:
        invites = await service.get_user_sent_invites(current_user.id)
    else:
        invites = await service.get_user_pending_invites(current_user.id)

    return invites


@invites_router.get("/{invite_id}", response_model=InviteRead)
async def get_invite(
    invite_id: int,
    service: InviteServiceDep,
    current_user: CurrentUserDep
):
    invite = await service.get_invite(invite_id)

    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")

    if invite.invitee_id != current_user.id and invite.inviter_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return invite


@invites_router.post("/{invite_id}/accept", response_model=InviteRead)
async def accept_invite(
    invite_id: int,
    service: InviteServiceDep,
    current_user: CurrentUserDep
):
    try:
        invite = await service.accept_invite(invite_id, current_user.id)
        return invite
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@invites_router.post("/{invite_id}/reject", response_model=InviteRead)
async def reject_invite(
    invite_id: int,
    service: InviteServiceDep,
    current_user: CurrentUserDep
):
    try:
        invite = await service.reject_invite(invite_id, current_user.id)
        return invite
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@invites_router.post("/{invite_id}/cancel", response_model=InviteRead)
async def cancel_invite(
    invite_id: int,
    service: InviteServiceDep,
    current_user: CurrentUserDep
):
    try:
        invite = await service.cancel_invite(invite_id, current_user.id)
        return invite
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@invites_router.delete("/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invite(
    invite_id: int,
    service: InviteServiceDep,
    current_user: CurrentUserDep
):
    try:
        deleted = await service.delete_invite(invite_id, current_user.id)
        return {"count_deleted": deleted}
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))