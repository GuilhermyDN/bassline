from pydantic import BaseModel, Field
from datetime import datetime


class BookingMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)


class BookingMessageOut(BaseModel):
    id: str
    booking_id: str
    sender_user_id: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True