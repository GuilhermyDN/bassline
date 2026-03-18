from pydantic import BaseModel, EmailStr

from app.models.user import UserType
from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    user_type: UserType
    city: str | None = None
    state: str | None = None
    # DJ profile fields (opcional — auto-criado no registro)
    stage_name: str | None = None
    bio: str | None = None
    genres: str | None = None
    # Club profile fields (opcional — auto-criado no registro)
    club_name: str | None = None
    description: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse