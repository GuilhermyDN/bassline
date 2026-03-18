from datetime import datetime
from pydantic import BaseModel
from app.models.subscription import PlanType, SubscriptionStatus


class SubscriptionOut(BaseModel):
    id: str
    user_id: str
    plan: PlanType
    status: SubscriptionStatus
    trial_ends_at: datetime | None
    current_period_end: datetime | None
    stripe_customer_id: str | None
    stripe_subscription_id: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class CheckoutSessionOut(BaseModel):
    checkout_url: str


class PortalSessionOut(BaseModel):
    portal_url: str
