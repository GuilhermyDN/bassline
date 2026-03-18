from pydantic import BaseModel

from app.models.user import UserType


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    user_type: str
    city: str | None = None
    state: str | None = None
    avatar_url: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}