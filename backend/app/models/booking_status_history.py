from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class BookingStatusHistory(Base):
    __tablename__ = "booking_status_history"

    id = Column(String, primary_key=True, default=generate_uuid)
    booking_id = Column(
        String,
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_status = Column(String, nullable=True)
    to_status = Column(String, nullable=False)
    changed_by_user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)