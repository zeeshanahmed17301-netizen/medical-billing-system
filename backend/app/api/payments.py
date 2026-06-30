"""
Payments API - Stripe integration and payment tracking
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import stripe

from app.utils.auth import require_role
from app.utils.config import settings

router = APIRouter()
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentIntent(BaseModel):
    invoice_number: str
    amount_cents: int   # Amount in cents
    currency: str = "usd"
    patient_email: str
    description: str = "Medical Bill Payment"


class PaymentConfirm(BaseModel):
    payment_intent_id: str
    invoice_number: str
    amount: float


@router.post("/create-intent")
async def create_payment_intent(
    payload: PaymentIntent,
    current_user: dict = Depends(require_role("admin", "biller", "patient"))
):
    """Create a Stripe PaymentIntent for online payment."""
    try:
        intent = stripe.PaymentIntent.create(
            amount=payload.amount_cents,
            currency=payload.currency,
            metadata={
                "invoice_number": payload.invoice_number,
                "patient_email": payload.patient_email,
            },
            description=payload.description,
            receipt_email=payload.patient_email,
        )
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": payload.amount_cents / 100,
            "currency": payload.currency,
        }
    except stripe.error.StripeError as e:
        raise HTTPException(400, str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(400, "Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")

    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        invoice_number = payment_intent["metadata"].get("invoice_number")
        amount_paid = payment_intent["amount_received"] / 100
        # In production: update invoice status, post payment, send receipt
        return {"status": "payment_posted", "invoice": invoice_number, "amount": amount_paid}

    return {"status": "event_received"}


@router.post("/record")
async def record_payment(
    payload: PaymentConfirm,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    """Manually record a payment (check, cash, etc.)."""
    return {
        "invoice_number": payload.invoice_number,
        "amount_paid": payload.amount,
        "status": "recorded",
        "message": "Payment recorded. Update DB in production."
    }


@router.get("/invoice/{invoice_number}")
async def get_invoice_payments(
    invoice_number: str,
    current_user: dict = Depends(require_role("admin", "biller", "patient"))
):
    return {"invoice_number": invoice_number, "payments": [], "total_paid": 0}
