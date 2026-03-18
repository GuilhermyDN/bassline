from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class PlanType(str, enum.Enum):
    DJ_FREE    = "DJ_FREE"      # trial / sem plano pago
    DJ_PRO     = "DJ_PRO"       # DJ com plano pago
    CLUB_FREE  = "CLUB_FREE"
    CLUB_PRO   = "CLUB_PRO"


class SubscriptionStatus(str, enum.Enum):
    TRIALING   = "TRIALING"     # dentro dos 30 dias grátis
    ACTIVE     = "ACTIVE"       # pagando
    PAST_DUE   = "PAST_DUE"     # pagamento atrasado
    CANCELED   = "CANCELED"     # cancelado
    EXPIRED    = "EXPIRED"      # trial expirou sem virar pago


class Subscription(Base):
    __tablename__ = "subscriptions"

    id                      = Column(String, primary_key=True, default=generate_uuid)
    user_id                 = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    plan                    = Column(SAEnum(PlanType), nullable=False, default=PlanType.DJ_FREE)
    status                  = Column(SAEnum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.TRIALING)

    # Stripe IDs
    stripe_customer_id      = Column(String, nullable=True, unique=True)
    stripe_subscription_id  = Column(String, nullable=True, unique=True)
    stripe_price_id         = Column(String, nullable=True)

    # Datas
    trial_ends_at           = Column(DateTime(timezone=True), nullable=True)
    current_period_end      = Column(DateTime(timezone=True), nullable=True)
    canceled_at             = Column(DateTime(timezone=True), nullable=True)

    created_at              = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at              = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
