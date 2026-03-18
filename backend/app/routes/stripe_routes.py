"""
Endpoints Stripe — checkout, webhook e portal do cliente.

Variáveis necessárias no .env:
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  STRIPE_DJ_PRO_PRICE_ID=price_...
  STRIPE_CLUB_PRO_PRICE_ID=price_...
"""
import os
from datetime import datetime, timedelta, timezone

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.subscription import Subscription, SubscriptionStatus, PlanType
from app.models.user import User, UserType
from app.schemas.subscription import CheckoutSessionOut, PortalSessionOut, SubscriptionOut

router = APIRouter(prefix="/stripe", tags=["Stripe"])

stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", "")


# ─── helpers ──────────────────────────────────────────────────────────────────

def get_or_create_subscription(db: Session, user: User) -> Subscription:
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        plan = PlanType.DJ_FREE if user.user_type == UserType.DJ else PlanType.CLUB_FREE
        trial_ends = datetime.now(timezone.utc) + timedelta(days=14)
        sub = Subscription(
            user_id=user.id,
            plan=plan,
            status=SubscriptionStatus.TRIALING,
            trial_ends_at=trial_ends,
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return sub


def _price_id_for_user(user: User) -> str:
    if user.user_type == UserType.DJ:
        return getattr(settings, "STRIPE_DJ_PRO_PRICE_ID", "")
    return getattr(settings, "STRIPE_CLUB_PRO_PRICE_ID", "")


# ─── endpoints ────────────────────────────────────────────────────────────────

@router.get("/subscription", response_model=SubscriptionOut)
def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna (ou cria) a subscription do usuário logado."""
    sub = get_or_create_subscription(db, current_user)

    # Atualiza status do trial se expirou
    if (
        sub.status == SubscriptionStatus.TRIALING
        and sub.trial_ends_at
        and sub.trial_ends_at < datetime.now(timezone.utc)
    ):
        sub.status = SubscriptionStatus.EXPIRED
        db.commit()
        db.refresh(sub)

    return sub


@router.post("/checkout", response_model=CheckoutSessionOut)
def create_checkout_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cria uma Stripe Checkout Session para assinar o plano Pro."""
    if not stripe.api_key:
        raise HTTPException(status_code=501, detail="Stripe não configurado.")

    sub = get_or_create_subscription(db, current_user)
    price_id = _price_id_for_user(current_user)

    if not price_id:
        raise HTTPException(status_code=501, detail="Price ID não configurado.")

    # Cria ou reutiliza o customer Stripe
    if not sub.stripe_customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.name,
            metadata={"user_id": current_user.id},
        )
        sub.stripe_customer_id = customer.id
        db.commit()

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")

    session = stripe.checkout.Session.create(
        customer=sub.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        subscription_data={
            "trial_period_days": 14,
            "metadata": {"user_id": current_user.id},
        },
        success_url=f"{frontend_url}/dashboard/{'dj' if current_user.user_type == UserType.DJ else 'club'}?upgraded=true",
        cancel_url=f"{frontend_url}/pricing?canceled=true",
        metadata={"user_id": current_user.id},
    )

    return CheckoutSessionOut(checkout_url=session.url)


@router.post("/portal", response_model=PortalSessionOut)
def create_portal_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Abre o Stripe Customer Portal para gerenciar/cancelar assinatura."""
    if not stripe.api_key:
        raise HTTPException(status_code=501, detail="Stripe não configurado.")

    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub or not sub.stripe_customer_id:
        raise HTTPException(status_code=404, detail="Sem assinatura ativa.")

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")

    session = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=f"{frontend_url}/dashboard/{'dj' if current_user.user_type == UserType.DJ else 'club'}",
    )

    return PortalSessionOut(portal_url=session.url)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db),
):
    """Recebe eventos do Stripe e sincroniza status da subscription."""
    webhook_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")
    if not webhook_secret:
        raise HTTPException(status_code=501, detail="Webhook secret não configurado.")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, webhook_secret)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Assinatura inválida.")

    ev_type = event["type"]
    data = event["data"]["object"]

    # ── subscription atualizada / criada ──────────────────────────────────────
    if ev_type in (
        "customer.subscription.created",
        "customer.subscription.updated",
    ):
        user_id = data.get("metadata", {}).get("user_id")
        if not user_id:
            # Tenta pelo customer
            customer_id = data.get("customer")
            sub_row = db.query(Subscription).filter(
                Subscription.stripe_customer_id == customer_id
            ).first()
        else:
            sub_row = db.query(Subscription).filter(
                Subscription.user_id == user_id
            ).first()

        if sub_row:
            stripe_status = data.get("status")
            status_map = {
                "trialing":  SubscriptionStatus.TRIALING,
                "active":    SubscriptionStatus.ACTIVE,
                "past_due":  SubscriptionStatus.PAST_DUE,
                "canceled":  SubscriptionStatus.CANCELED,
                "unpaid":    SubscriptionStatus.PAST_DUE,
            }
            sub_row.status = status_map.get(stripe_status, SubscriptionStatus.EXPIRED)
            sub_row.stripe_subscription_id = data.get("id")
            sub_row.stripe_price_id = (data.get("items", {}).get("data") or [{}])[0].get("price", {}).get("id")

            period_end = data.get("current_period_end")
            if period_end:
                sub_row.current_period_end = datetime.fromtimestamp(period_end, tz=timezone.utc)

            trial_end = data.get("trial_end")
            if trial_end:
                sub_row.trial_ends_at = datetime.fromtimestamp(trial_end, tz=timezone.utc)

            # Atualiza o plano para Pro quando ativa
            if sub_row.status == SubscriptionStatus.ACTIVE:
                user = db.query(User).filter(User.id == sub_row.user_id).first()
                if user:
                    sub_row.plan = PlanType.DJ_PRO if user.user_type == UserType.DJ else PlanType.CLUB_PRO

            db.commit()

    # ── cancelamento ──────────────────────────────────────────────────────────
    elif ev_type == "customer.subscription.deleted":
        stripe_sub_id = data.get("id")
        sub_row = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_sub_id
        ).first()
        if sub_row:
            sub_row.status = SubscriptionStatus.CANCELED
            sub_row.canceled_at = datetime.now(timezone.utc)
            db.commit()

    return {"received": True}
