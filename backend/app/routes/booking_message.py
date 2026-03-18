from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.booking import Booking
from app.models.booking_message import BookingMessage
from app.models.dj import DJProfile
from app.models.club import ClubProfile
from app.schemas.booking_message import BookingMessageCreate, BookingMessageOut

router = APIRouter(prefix="/booking-messages", tags=["booking-messages"])


def _get_booking_and_validate_access(booking_id: str, current_user, db: Session) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking não encontrado"
        )

    dj_profile = db.query(DJProfile).filter(DJProfile.id == booking.dj_id).first()
    club_profile = db.query(ClubProfile).filter(ClubProfile.id == booking.club_id).first()

    is_dj_owner = dj_profile and dj_profile.user_id == current_user.id
    is_club_owner = club_profile and club_profile.user_id == current_user.id

    if not is_dj_owner and not is_club_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem acesso a este chat"
        )

    return booking


@router.post("/{booking_id}", response_model=BookingMessageOut, status_code=status.HTTP_201_CREATED)
def send_booking_message(
    booking_id: str,
    payload: BookingMessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    booking = _get_booking_and_validate_access(booking_id, current_user, db)

    message_text = payload.message.strip()
    if not message_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mensagem não pode ser vazia"
        )

    new_message = BookingMessage(
        booking_id=booking.id,
        sender_user_id=current_user.id,
        message=message_text,
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return new_message


@router.get("/{booking_id}", response_model=list[BookingMessageOut])
def list_booking_messages(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _get_booking_and_validate_access(booking_id, current_user, db)

    messages = (
        db.query(BookingMessage)
        .filter(BookingMessage.booking_id == booking_id)
        .order_by(BookingMessage.created_at.asc())
        .all()
    )

    return messages