from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.availability import AvailabilityBlock, AvailabilityBlockType
from app.models.booking import Booking, BookingStatus
from app.models.booking_status_history import BookingStatusHistory
from app.models.club import ClubProfile
from app.models.dj import DJProfile
from app.models.user import User, UserType
from app.schemas.booking import BookingCreateRequest, BookingResponse
from app.schemas.booking_status_history import (
    BookingStatusHistoryOut,
    BookingStatusUpdate,
)
from app.services import email as email_svc

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _fmt_date(dt) -> str:
    if not dt:
        return "—"
    try:
        return dt.strftime("%d/%m/%Y %H:%M")
    except Exception:
        return str(dt)


def has_time_conflict(
    db: Session,
    dj_profile_id: str,
    start_time,
    end_time,
    ignore_booking_id: str | None = None,
) -> bool:
    query = db.query(AvailabilityBlock).filter(
        AvailabilityBlock.dj_id == dj_profile_id,
        and_(
            AvailabilityBlock.start_time < end_time,
            AvailabilityBlock.end_time > start_time,
        ),
    )

    if ignore_booking_id:
        query = query.filter(
            (AvailabilityBlock.source_booking_id.is_(None))
            | (AvailabilityBlock.source_booking_id != ignore_booking_id)
        )

    return query.first() is not None


def get_club_profile_or_fail(db: Session, current_user: User) -> ClubProfile:
    if current_user.user_type != UserType.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas CLUB pode operar propostas como contratante",
        )

    club_profile = (
        db.query(ClubProfile).filter(ClubProfile.user_id == current_user.id).first()
    )
    if not club_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de club não encontrado",
        )

    return club_profile


def get_dj_profile_or_fail(db: Session, current_user: User) -> DJProfile:
    if current_user.user_type != UserType.DJ:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas DJ pode operar propostas como artista",
        )

    dj_profile = (
        db.query(DJProfile).filter(DJProfile.user_id == current_user.id).first()
    )
    if not dj_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de DJ não encontrado",
        )

    return dj_profile


def get_booking_or_fail(db: Session, booking_id: str) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposta não encontrada",
        )
    return booking


def ensure_booking_access(db: Session, booking: Booking, current_user: User) -> None:
    if current_user.user_type == UserType.DJ:
        dj_profile = get_dj_profile_or_fail(db, current_user)
        if booking.dj_id != dj_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não pode acessar proposta de outro DJ",
            )
        return

    if current_user.user_type == UserType.CLUB:
        club_profile = get_club_profile_or_fail(db, current_user)
        if booking.club_id != club_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não pode acessar proposta de outro club",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Tipo de usuário sem acesso a propostas",
    )


def create_status_history(
    db: Session,
    booking: Booking,
    from_status: str | None,
    to_status: str,
    changed_by_user_id: str,
    reason: str | None = None,
) -> None:
    history_entry = BookingStatusHistory(
        booking_id=booking.id,
        from_status=from_status,
        to_status=to_status,
        changed_by_user_id=changed_by_user_id,
        reason=reason,
    )
    db.add(history_entry)


@router.post("", response_model=BookingResponse)
def create_booking_proposal(
    payload: BookingCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    club_profile = get_club_profile_or_fail(db, current_user)

    if (
        payload.end_time
        and payload.start_time
        and payload.end_time <= payload.start_time
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time deve ser maior que start_time",
        )

    dj_profile = (
        db.query(DJProfile).filter(DJProfile.id == payload.dj_profile_id).first()
    )
    if not dj_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de DJ não encontrado",
        )

    if payload.start_time and payload.end_time:
        if has_time_conflict(db, dj_profile.id, payload.start_time, payload.end_time):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="DJ indisponível nesse intervalo",
            )

    booking = Booking(
        dj_id=dj_profile.id,
        club_id=club_profile.id,
        event_name=payload.event_name,
        event_date=payload.event_date,
        fee_amount=payload.fee_amount,
        start_time=payload.start_time,
        end_time=payload.end_time,
        logistics=payload.logistics,
        notes=payload.notes,
        status=BookingStatus.PROPOSTA,
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    # ── Notify DJ via email ───────────────────────────────────────────────────
    dj_user = db.query(User).filter(User.id == dj_profile.user_id).first()
    if dj_user:
        background_tasks.add_task(
            email_svc.send_new_booking_to_dj,
            dj_email=dj_user.email,
            dj_name=dj_user.name,
            club_name=club_profile.club_name or current_user.name,
            event_name=payload.event_name,
            event_date=_fmt_date(payload.event_date),
            fee=str(payload.fee_amount) if payload.fee_amount else None,
            frontend_url=settings.FRONTEND_URL,
        )

    return booking


@router.get("/me/sent", response_model=list[BookingResponse])
def list_my_sent_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    club_profile = get_club_profile_or_fail(db, current_user)

    return (
        db.query(Booking)
        .filter(Booking.club_id == club_profile.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.get("/me/received", response_model=list[BookingResponse])
def list_my_received_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dj_profile = get_dj_profile_or_fail(db, current_user)

    return (
        db.query(Booking)
        .filter(Booking.dj_id == dj_profile.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking_detail(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking_or_fail(db, booking_id)
    ensure_booking_access(db, booking, current_user)
    return booking


@router.get(
    "/{booking_id}/history",
    response_model=list[BookingStatusHistoryOut],
)
def get_booking_status_history(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking_or_fail(db, booking_id)
    ensure_booking_access(db, booking, current_user)

    history = (
        db.query(BookingStatusHistory)
        .filter(BookingStatusHistory.booking_id == booking_id)
        .order_by(BookingStatusHistory.created_at.asc())
        .all()
    )

    return history


@router.patch("/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: str,
    payload: BookingStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking_or_fail(db, booking_id)

    allowed_statuses = {
        BookingStatus.NEGOCIANDO,
        BookingStatus.APROVADO,
        BookingStatus.RECUSADO,
        BookingStatus.CANCELADO,
    }

    new_status = payload.status
    reason = payload.reason.strip() if payload.reason else None

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status inválido para esta ação",
        )

    if new_status in {BookingStatus.RECUSADO, BookingStatus.CANCELADO} and not reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Motivo é obrigatório para RECUSADO e CANCELADO",
        )

    old_status = booking.status

    if old_status == new_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A proposta já está nesse status",
        )

    if new_status in {
        BookingStatus.NEGOCIANDO,
        BookingStatus.APROVADO,
        BookingStatus.RECUSADO,
    }:
        dj_profile = get_dj_profile_or_fail(db, current_user)

        if booking.dj_id != dj_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não pode alterar proposta de outro DJ",
            )

        if new_status == BookingStatus.APROVADO:
            if not booking.start_time or not booking.end_time:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Não é possível aprovar proposta sem start_time e end_time",
                )

            if has_time_conflict(
                db,
                dj_profile.id,
                booking.start_time,
                booking.end_time,
                ignore_booking_id=booking.id,
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Existe conflito de agenda para aprovar esta proposta",
                )

            existing_block = (
                db.query(AvailabilityBlock)
                .filter(AvailabilityBlock.source_booking_id == booking.id)
                .first()
            )

            if not existing_block:
                block = AvailabilityBlock(
                    dj_id=dj_profile.id,
                    start_time=booking.start_time,
                    end_time=booking.end_time,
                    block_type=AvailabilityBlockType.BOOKING,
                    source_booking_id=booking.id,
                    title=booking.event_name,
                    notes=booking.notes,
                )
                db.add(block)

        booking.status = new_status

        create_status_history(
            db=db,
            booking=booking,
            from_status=old_status,
            to_status=new_status,
            changed_by_user_id=current_user.id,
            reason=reason,
        )

        db.commit()
        db.refresh(booking)

        # ── Email the club about the DJ's decision ────────────────────────────
        club_obj = (
            db.query(ClubProfile)
            .options(joinedload(ClubProfile.user))
            .filter(ClubProfile.id == booking.club_id)
            .first()
        )
        if club_obj and club_obj.user:
            if new_status == BookingStatus.APROVADO:
                background_tasks.add_task(
                    email_svc.send_booking_approved_to_club,
                    club_email=club_obj.user.email,
                    club_name=club_obj.club_name or club_obj.user.name,
                    dj_name=current_user.name,
                    event_name=booking.event_name,
                    event_date=_fmt_date(booking.event_date),
                    frontend_url=settings.FRONTEND_URL,
                )
            elif new_status == BookingStatus.RECUSADO:
                background_tasks.add_task(
                    email_svc.send_booking_refused_to_club,
                    club_email=club_obj.user.email,
                    club_name=club_obj.club_name or club_obj.user.name,
                    dj_name=current_user.name,
                    event_name=booking.event_name,
                    reason=reason,
                    frontend_url=settings.FRONTEND_URL,
                )
            elif new_status == BookingStatus.NEGOCIANDO:
                background_tasks.add_task(
                    email_svc.send_booking_negotiating_to_club,
                    club_email=club_obj.user.email,
                    club_name=club_obj.club_name or club_obj.user.name,
                    dj_name=current_user.name,
                    event_name=booking.event_name,
                    frontend_url=settings.FRONTEND_URL,
                )

        return booking

    if new_status == BookingStatus.CANCELADO:
        if current_user.user_type == UserType.DJ:
            dj_profile = get_dj_profile_or_fail(db, current_user)
            if booking.dj_id != dj_profile.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Você não pode cancelar proposta de outro DJ",
                )

        elif current_user.user_type == UserType.CLUB:
            club_profile = get_club_profile_or_fail(db, current_user)
            if booking.club_id != club_profile.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Você não pode cancelar proposta de outro club",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tipo de usuário sem permissão para cancelar proposta",
            )

        auto_block = (
            db.query(AvailabilityBlock)
            .filter(
                AvailabilityBlock.source_booking_id == booking.id,
                AvailabilityBlock.block_type == AvailabilityBlockType.BOOKING,
            )
            .first()
        )

        if auto_block:
            db.delete(auto_block)

        booking.status = BookingStatus.CANCELADO

        create_status_history(
            db=db,
            booking=booking,
            from_status=old_status,
            to_status=BookingStatus.CANCELADO,
            changed_by_user_id=current_user.id,
            reason=reason,
        )

        db.commit()
        db.refresh(booking)

        # ── Notify the OTHER party about cancellation ─────────────────────────
        if current_user.user_type == UserType.DJ:
            # DJ canceled → notify club
            club_obj = (
                db.query(ClubProfile)
                .options(joinedload(ClubProfile.user))
                .filter(ClubProfile.id == booking.club_id)
                .first()
            )
            if club_obj and club_obj.user:
                background_tasks.add_task(
                    email_svc.send_booking_canceled,
                    to_email=club_obj.user.email,
                    to_name=club_obj.club_name or club_obj.user.name,
                    canceled_by=current_user.name,
                    event_name=booking.event_name,
                    reason=reason,
                    frontend_url=settings.FRONTEND_URL,
                )
        else:
            # Club canceled → notify DJ
            dj_obj = (
                db.query(DJProfile)
                .options(joinedload(DJProfile.user))
                .filter(DJProfile.id == booking.dj_id)
                .first()
            )
            if dj_obj and dj_obj.user:
                background_tasks.add_task(
                    email_svc.send_booking_canceled,
                    to_email=dj_obj.user.email,
                    to_name=dj_obj.user.name,
                    canceled_by=current_user.name,
                    event_name=booking.event_name,
                    reason=reason,
                    frontend_url=settings.FRONTEND_URL,
                )

        return booking

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Ação não suportada",
    )
