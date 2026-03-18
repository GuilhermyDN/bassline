from pydantic import BaseModel


class DJCreateRequest(BaseModel):
    stage_name: str
    bio: str | None = None
    genres: str | None = None
    city: str | None = None      # saved on User
    state: str | None = None     # saved on User
    instagram_url: str | None = None
    soundcloud_url: str | None = None
    youtube_url: str | None = None


class DJResponse(BaseModel):
    id: str
    user_id: str
    stage_name: str
    bio: str | None = None
    genres: str | None = None
    instagram_url: str | None = None
    soundcloud_url: str | None = None
    youtube_url: str | None = None
    # Fields sourced from the related User record
    name: str | None = None
    city: str | None = None
    state: str | None = None
    avatar_url: str | None = None

    model_config = {"from_attributes": True}