import stripe
import logging
from fastapi import APIRouter, Request, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings
from app.db.client import get_supabase

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY
router = APIRouter()

PRICE_MAP = {
    "starter":      lambda: settings.STRIPE_PRICE_STARTER,
    "growth":       lambda: settings.STRIPE_PRICE_GROWTH,
    "professional": lambda: settings.STRIPE_PRICE_PROFESSIONAL,
}

class CheckoutRequest(BaseModel):
    plan: str
    user_id: str
    email: str
    org_id: str

class PortalRequest(BaseModel):
    user_id: str

@router.post("/checkout")
async def create_checkout(req: CheckoutRequest):
    if req.plan not in PRICE_MAP:
        raise HTTPException(400, f"Invalid plan: {req.plan}")
    price_id = PRICE_MAP[req.plan]()
    if not price_id:
        raise HTTPException(500, f"Price ID not configured for plan: {req.plan}")
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            customer_email=req.email,
            metadata={"user_id": req.user_id, "org_id": req.org_id, "plan": req.plan},
            success_url=f"{settings.FRONTEND_URL}/settings?billing=success",
            cancel_url=f"{settings.FRONTEND_URL}/settings?billing=cancelled",
        )
        return {"url": session.url, "session_id": session.id}
    except stripe.StripeError as e:
        raise HTTPException(500, str(e))

@router.post("/portal")
async def create_portal(req: PortalRequest):
    db = get_supabase()
    result = db.table("subscriptions").select("stripe_customer_id").eq("user_id", req.user_id).single().execute()
    if not result.data or not result.data.get("stripe_customer_id"):
        raise HTTPException(404, "No active subscription found")
    try:
        session = stripe.billing_portal.Session.create(
            customer=result.data["stripe_customer_id"],
            return_url=f"{settings.FRONTEND_URL}/settings",
        )
        return {"url": session.url}
    except stripe.StripeError as e:
        raise HTTPException(500, str(e))

@router.get("/subscription/{user_id}")
async def get_subscription(user_id: str):
    db = get_supabase()
    result = db.table("subscriptions").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        return {"plan": None, "status": "none"}
    return result.data

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    body = await request.body()
    try:
        event = stripe.Webhook.construct_event(body, stripe_signature, settings.STRIPE_WEBHOOK_SECRET)
    except stripe.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")
    db = get_supabase()
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        org_id = session.get("metadata", {}).get("org_id")
        plan = session.get("metadata", {}).get("plan")
        if user_id:
            stripe_sub = stripe.Subscription.retrieve(session["subscription"])
            db.table("subscriptions").upsert({
                "user_id": user_id, "org_id": org_id, "plan": plan, "status": "active",
                "stripe_customer_id": session["customer"],
                "stripe_subscription_id": session["subscription"],
                "current_period_end": stripe_sub["current_period_end"],
            }).execute()
    elif event["type"] == "customer.subscription.updated":
        sub = event["data"]["object"]
        try:
            price_id = sub["items"]["data"][0]["price"]["id"]
            plan = "starter" if price_id == settings.STRIPE_PRICE_STARTER else \
                   "growth" if price_id == settings.STRIPE_PRICE_GROWTH else \
                   "professional" if price_id == settings.STRIPE_PRICE_PROFESSIONAL else "unknown"
        except Exception:
            plan = "unknown"
        db.table("subscriptions").update({
            "status": sub["status"], "plan": plan,
            "current_period_end": sub["current_period_end"],
        }).eq("stripe_subscription_id", sub["id"]).execute()
    elif event["type"] == "customer.subscription.deleted":
        db.table("subscriptions").update({"status": "cancelled"}).eq("stripe_subscription_id", event["data"]["object"]["id"]).execute()
    elif event["type"] == "invoice.payment_failed":
        db.table("subscriptions").update({"status": "past_due"}).eq("stripe_customer_id", event["data"]["object"]["customer"]).execute()
    return {"received": True}
