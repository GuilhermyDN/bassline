from pydantic import BaseModel


class ClubCreateRequest(BaseModel):
    club_name: str
    description: str | None = None
    instagram_url: str | None = None
    city: str | None = None
    state: str | None = None


class ClubResponse(BaseModel):
    id: str
    user_id: str
    club_name: str
    description: str | None = None
    instagram_url: str | None = None
    city: str | None = None
    state: str | None = None

    model_config = {"from_attributes": True}