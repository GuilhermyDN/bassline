import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AvailabilityBlockType(str, enum.Enum):
    MANUAL = "MANUAL"
    BOOKING = "BOOKING"
    GOOGLE_CALENDAR = "GOOGLE_CALENDAR"


class AvailabilityBlock(Base):
    __tablename__ = "availability_blocks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dj_id: Mapped[str] = mapped_column(String, ForeignKey("dj_profiles.id"), nullable=False, index=True)

    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)

    block_type: Mapped[AvailabilityBlockType] = mapped_column(
        Enum(AvailabilityBlockType),
        nullable=False,
        default=AvailabilityBlockType.MANUAL,
    )

    source_booking_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("bookings.id"),
        nullable=True
    )

    title: Mapped[str | None] = mapped_column(String(180), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )