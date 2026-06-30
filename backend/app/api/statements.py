"""
Patient Statements & Follow-up API
"""
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.utils.auth import require_role

router = APIRouter()


class StatementSend(BaseModel):
    invoice_number: str
    patient_id: str
    channel: str  # email, sms, mail
    amount_due: float
    patient_email: Optional[str] = None
    patient_phone: Optional[str] = None


@router.post("/send")
async def send_statement(
    payload: StatementSend,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    """Send a billing statement to patient via email/SMS."""
    background_tasks.add_task(dispatch_statement, payload)
    return {
        "invoice_number": payload.invoice_number,
        "channel": payload.channel,
        "status": "queued",
        "message": f"Statement will be sent via {payload.channel}"
    }


async def dispatch_statement(payload: StatementSend):
    """Background: send email or SMS statement."""
    if payload.channel == "email" and payload.patient_email:
        # In production: use SMTP / SendGrid
        print(f"[EMAIL] Sending statement for {payload.invoice_number} to {payload.patient_email}")
    elif payload.channel == "sms" and payload.patient_phone:
        # In production: use Twilio
        print(f"[SMS] Sending statement to {payload.patient_phone}")


@router.post("/collection-escalate")
async def escalate_to_collection(
    invoice_number: str,
    days_overdue: int,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    """Escalate overdue invoice to collection agency."""
    if days_overdue < 90:
        return {"error": "Invoice must be 90+ days overdue for collection escalation"}
    # In production: call collection agency API
    return {
        "invoice_number": invoice_number,
        "action": "sent_to_collection",
        "days_overdue": days_overdue,
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Collection agency notified (mock). Integrate real agency API."
    }


@router.get("/overdue")
async def list_overdue_invoices(
    days: int = 30,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    """List invoices overdue by N+ days."""
    return {"overdue_invoices": [], "days_threshold": days}
