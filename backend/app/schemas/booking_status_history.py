from datetime import datetime
from pydantic import BaseModel, Field


class BookingStatusUpdate(BaseModel):
    status: str
    reason: str | None = Field(default=None, max_length=2000)


class BookingStatusHistoryOut(BaseModel):
    id: str
    booking_id: str
    from_status: str | None
    to_status: str
    changed_by_user_id: str
    reason: str | None
    created_at: datetime

    class Config:
        from_attributes = True