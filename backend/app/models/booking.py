import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BookingStatus(str, enum.Enum):
    PROPOSTA = "PROPOSTA"
    NEGOCIANDO = "NEGOCIANDO"
    APROVADO = "APROVADO"
    RECUSADO = "RECUSADO"
    CANCELADO = "CANCELADO"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dj_id: Mapped[str] = mapped_column(String, ForeignKey("dj_profiles.id"), nullable=False)
    club_id: Mapped[str] = mapped_column(String, ForeignKey("club_profiles.id"), nullable=False)

    event_name: Mapped[str] = mapped_column(String(180), nullable=False)
    event_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fee_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    start_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    logistics: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus),
        default=BookingStatus.PROPOSTA,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )