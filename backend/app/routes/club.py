from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.club import ClubProfile
from app.models.user import User, UserType
from app.schemas.club import ClubCreateRequest, ClubResponse

router = APIRouter(prefix="/clubs", tags=["Clubs"])


@router.post("/me", response_model=ClubResponse)
def create_my_club_profile(
    payload: ClubCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.user_type != UserType.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários do tipo CLUB podem criar perfil de club"
        )

    existing_profile = (
        db.query(ClubProfile)
        .filter(ClubProfile.user_id == current_user.id)
        .first()
    )
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Club já possui perfil"
        )

    club = ClubProfile(
        user_id=current_user.id,
        club_name=payload.club_name,
        description=payload.description,
        instagram_url=payload.instagram_url,
        city=payload.city,
        state=payload.state,
    )

    db.add(club)
    db.commit()
    db.refresh(club)

    return club


@router.get("/me", response_model=ClubResponse)
def get_my_club_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.user_type != UserType.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários do tipo CLUB possuem perfil de club"
        )

    club = db.query(ClubProfile).filter(ClubProfile.user_id == current_user.id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de club não encontrado"
        )

    return club