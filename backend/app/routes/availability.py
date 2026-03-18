from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.availability import AvailabilityBlock, AvailabilityBlockType
from app.models.dj import DJProfile
from app.models.user import User, UserType
from app.schemas.availability import (
    AvailabilityBlockCreateRequest,
    AvailabilityBlockResponse,
    AvailabilityBlockUpdateRequest,
    DJAvailabilityQueryResponse,
)

router = APIRouter(prefix="/availability", tags=["Availability"])


def has_time_conflict(
    db: Session,
    dj_profile_id: str,
    start_time: datetime,
    end_time: datetime,
    ignore_block_id: str | None = None,
) -> bool:
    query = db.query(AvailabilityBlock).filter(
        AvailabilityBlock.dj_id == dj_profile_id,
        and_(
            AvailabilityBlock.start_time < end_time,
            AvailabilityBlock.end_time > start_time,
        ),
    )

    if ignore_block_id:
        query = query.filter(AvailabilityBlock.id != ignore_block_id)

    return query.first() is not None


def get_my_dj_profile_or_fail(db: Session, current_user: User) -> DJProfile:
    if current_user.user_type != UserType.DJ:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Apenas DJ pode operar agenda"
        )

    dj_profile = (
        db.query(DJProfile).filter(DJProfile.user_id == current_user.id).first()
    )
    if not dj_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de DJ não encontrado"
        )

    return dj_profile


@router.post("/me/blocks", response_model=AvailabilityBlockResponse)
def create_manual_block(
    payload: AvailabilityBlockCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.end_time <= payload.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time deve ser maior que start_time",
        )

    dj_profile = get_my_dj_profile_or_fail(db, current_user)

    if has_time_conflict(db, dj_profile.id, payload.start_time, payload.end_time):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe bloqueio nesse intervalo",
        )

    block = AvailabilityBlock(
        dj_id=dj_profile.id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        block_type=AvailabilityBlockType.MANUAL,
        title=payload.title,
        notes=payload.notes,
    )

    db.add(block)
    db.commit()
    db.refresh(block)

    return block


@router.get("/me/blocks", response_model=list[AvailabilityBlockResponse])
def list_my_blocks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dj_profile = get_my_dj_profile_or_fail(db, current_user)

    return (
        db.query(AvailabilityBlock)
        .filter(AvailabilityBlock.dj_id == dj_profile.id)
        .order_by(AvailabilityBlock.start_time.asc())
        .all()
    )


@router.put("/me/blocks/{block_id}", response_model=AvailabilityBlockResponse)
def update_manual_block(
    block_id: str,
    payload: AvailabilityBlockUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.end_time <= payload.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time deve ser maior que start_time",
        )

    dj_profile = get_my_dj_profile_or_fail(db, current_user)

    block = (
        db.query(AvailabilityBlock)
        .filter(
            AvailabilityBlock.id == block_id,
            AvailabilityBlock.dj_id == dj_profile.id,
        )
        .first()
    )
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bloqueio não encontrado"
        )

    if block.block_type != AvailabilityBlockType.MANUAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Somente bloqueios MANUAL podem ser editados",
        )

    if has_time_conflict(
        db,
        dj_profile.id,
        payload.start_time,
        payload.end_time,
        ignore_block_id=block.id,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe conflito de agenda nesse intervalo",
        )

    block.start_time = payload.start_time
    block.end_time = payload.end_time
    block.title = payload.title
    block.notes = payload.notes

    db.commit()
    db.refresh(block)

    return block


@router.delete("/me/blocks/{block_id}")
def delete_manual_block(
    block_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dj_profile = get_my_dj_profile_or_fail(db, current_user)

    block = (
        db.query(AvailabilityBlock)
        .filter(
            AvailabilityBlock.id == block_id,
            AvailabilityBlock.dj_id == dj_profile.id,
        )
        .first()
    )
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bloqueio não encontrado"
        )

    if block.block_type != AvailabilityBlockType.MANUAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Somente bloqueios MANUAL podem ser removidos por esta rota",
        )

    db.delete(block)
    db.commit()

    return {"message": "Bloqueio removido com sucesso"}


@router.get("/dj/{dj_profile_id}", response_model=DJAvailabilityQueryResponse)
def check_dj_availability(
    dj_profile_id: str,
    start_time: datetime = Query(...),
    end_time: datetime = Query(...),
    db: Session = Depends(get_db),
):
    if end_time <= start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time deve ser maior que start_time",
        )

    dj_profile = db.query(DJProfile).filter(DJProfile.id == dj_profile_id).first()
    if not dj_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de DJ não encontrado"
        )

    conflict = has_time_conflict(db, dj_profile_id, start_time, end_time)

    return DJAvailabilityQueryResponse(
        dj_profile_id=dj_profile_id,
        requested_start=start_time,
        requested_end=end_time,
        is_available=not conflict,
    )
