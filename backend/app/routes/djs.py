from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.dj import DJProfile
from app.models.user import User, UserType
from app.schemas.dj import DJCreateRequest, DJResponse

router = APIRouter(prefix="/djs", tags=["DJs"])


def _enrich(dj: DJProfile) -> dict:
    """Merge DJProfile + User fields into a single dict for DJResponse."""
    u = dj.user
    return {
        "id": dj.id,
        "user_id": dj.user_id,
        "stage_name": dj.stage_name,
        "bio": dj.bio,
        "genres": dj.genres,
        "instagram_url": dj.instagram_url,
        "soundcloud_url": dj.soundcloud_url,
        "youtube_url": dj.youtube_url,
        "name": u.name if u else None,
        "city": u.city if u else None,
        "state": u.state if u else None,
        "avatar_url": u.avatar_url if u else None,
    }


@router.get("", response_model=list[DJResponse])
def list_djs(db: Session = Depends(get_db)):
    djs = db.query(DJProfile).options(joinedload(DJProfile.user)).all()
    return [_enrich(dj) for dj in djs]


# ⚠️ Rotas /me DEVEM vir antes de /{id} para o FastAPI não interpretar "me" como um ID


@router.post("/me", response_model=DJResponse)
def create_my_dj_profile(
    payload: DJCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.user_type != UserType.DJ:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários do tipo DJ podem criar perfil de DJ",
        )

    existing_profile = (
        db.query(DJProfile).filter(DJProfile.user_id == current_user.id).first()
    )
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="DJ já possui perfil"
        )

    # Update city/state on User if provided
    if payload.city is not None:
        current_user.city = payload.city
    if payload.state is not None:
        current_user.state = payload.state

    dj = DJProfile(
        user_id=current_user.id,
        stage_name=payload.stage_name,
        bio=payload.bio,
        genres=payload.genres,
        instagram_url=payload.instagram_url,
        soundcloud_url=payload.soundcloud_url,
        youtube_url=payload.youtube_url,
    )

    db.add(dj)
    db.commit()
    db.refresh(dj)
    db.refresh(current_user)

    return _enrich(dj)


@router.get("/me", response_model=DJResponse)
def get_my_dj_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.user_type != UserType.DJ:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários do tipo DJ possuem perfil de DJ",
        )

    dj = (
        db.query(DJProfile)
        .options(joinedload(DJProfile.user))
        .filter(DJProfile.user_id == current_user.id)
        .first()
    )
    if not dj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de DJ não encontrado"
        )

    return _enrich(dj)


@router.put("/me", response_model=DJResponse)
def update_my_dj_profile(
    payload: DJCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.user_type != UserType.DJ:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários do tipo DJ podem editar perfil de DJ",
        )

    dj = db.query(DJProfile).filter(DJProfile.user_id == current_user.id).first()
    if not dj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de DJ não encontrado"
        )

    # Also update city/state on User if provided
    if payload.city is not None:
        current_user.city = payload.city
    if payload.state is not None:
        current_user.state = payload.state

    dj.stage_name = payload.stage_name
    dj.bio = payload.bio
    dj.genres = payload.genres
    dj.instagram_url = payload.instagram_url
    dj.soundcloud_url = payload.soundcloud_url
    dj.youtube_url = payload.youtube_url

    db.commit()
    db.refresh(dj)
    db.refresh(current_user)

    return _enrich(dj)


@router.get("/{dj_id}", response_model=DJResponse)
def get_dj(dj_id: str, db: Session = Depends(get_db)):
    dj = (
        db.query(DJProfile)
        .options(joinedload(DJProfile.user))
        .filter(DJProfile.id == dj_id)
        .first()
    )
    if not dj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="DJ não encontrado"
        )
    return _enrich(dj)
