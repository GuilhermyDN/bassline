from datetime import datetime

from pydantic import BaseModel

from app.models.availability import AvailabilityBlockType


class AvailabilityBlockCreateRequest(BaseModel):
    start_time: datetime
    end_time: datetime
    title: str | None = None
    notes: str | None = None


class AvailabilityBlockUpdateRequest(BaseModel):
    start_time: datetime
    end_time: datetime
    title: str | None = None
    notes: str | None = None


class AvailabilityBlockResponse(BaseModel):
    id: str
    dj_id: str
    start_time: datetime
    end_time: datetime
    block_type: AvailabilityBlockType
    source_booking_id: str | None = None
    title: str | None = None
    notes: str | None = None

    model_config = {"from_attributes": True}


class DJAvailabilityQueryResponse(BaseModel):
    dj_profile_id: str
    requested_start: datetime
    requested_end: datetime
    is_available: bool