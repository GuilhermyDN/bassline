from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.booking import BookingStatus


class BookingCreateRequest(BaseModel):
    dj_profile_id: str
    event_name: str
    event_date: datetime
    fee_amount: Decimal | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    logistics: str | None = None
    notes: str | None = None


class BookingStatusUpdateRequest(BaseModel):
    status: BookingStatus


class BookingResponse(BaseModel):
    id: str
    dj_id: str
    club_id: str
    event_name: str
    event_date: datetime
    fee_amount: Decimal | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    logistics: str | None = None
    notes: str | None = None
    status: BookingStatus

    model_config = {"from_attributes": True}