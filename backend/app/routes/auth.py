from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserType
from app.models.dj import DJProfile
from app.models.club import ClubProfile
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services import email as email_svc

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já cadastrado"
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        user_type=payload.user_type,
        city=payload.city,
        state=payload.state,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # ── Auto-criar perfil DJ ───────────────────────────────────────────────────
    if user.user_type == UserType.DJ and payload.stage_name:
        dj_profile = DJProfile(
            user_id=user.id,
            stage_name=payload.stage_name,
            bio=payload.bio,
            genres=payload.genres,
        )
        db.add(dj_profile)
        db.commit()

    # ── Auto-criar perfil Club ─────────────────────────────────────────────────
    if user.user_type == UserType.CLUB and payload.club_name:
        club_profile = ClubProfile(
            user_id=user.id,
            club_name=payload.club_name,
            description=payload.description,
            city=payload.city,
            state=payload.state,
        )
        db.add(club_profile)
        db.commit()

    token = create_access_token(user.id)

    # ── Welcome email ─────────────────────────────────────────────────────────
    background_tasks.add_task(
        email_svc.send_welcome,
        to=user.email,
        name=user.name,
        frontend_url=settings.FRONTEND_URL,
    )

    return TokenResponse(
        access_token=token,
        user=user,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )

    token = create_access_token(user.id)

    return TokenResponse(
        access_token=token,
        user=user,
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
