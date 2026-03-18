import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _prepare_password(password: str) -> str:
    """
    Bcrypt tem limite de 72 bytes. Para senhas longas, fazemos um
    pré-hash com SHA-256 (hex = 64 chars, sempre dentro do limite).
    """
    encoded = password.encode("utf-8")
    if len(encoded) > 72:
        return hashlib.sha256(encoded).hexdigest()
    return password


def hash_password(password: str) -> str:
    return pwd_context.hash(_prepare_password(password))


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_prepare_password(password), hashed_password)


def create_access_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode = {
        "sub": str(subject),
        "exp": expire,
    }

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)