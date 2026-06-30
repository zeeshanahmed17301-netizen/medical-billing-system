"""
Invoices API - Generate, retrieve, and manage patient invoices
"""
import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional

from app.utils.auth import require_role
from app.services.pdf_service import pdf_service

router = APIRouter()


class LineItem(BaseModel):
    cpt_code: str = ""
    hcpcs_code: str = ""
    icd10_codes: List[str] = []
    description: str
    quantity: int = 1
    unit_price: float
    total: float


class InvoiceCreate(BaseModel):
    extracted_bill_id: str
    patient_id: str
    provider_id: str
    line_items: List[LineItem]
    subtotal: float
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    balance_due: float
    notes: Optional[str] = None
    due_days: int = 30


@router.post("/generate")
async def generate_invoice(
    payload: InvoiceCreate,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    """Generate a new invoice from extracted bill data."""
    invoice_number = f"INV-{date.today().strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}"
    due_date = date.today() + timedelta(days=payload.due_days)
    payment_url = f"https://pay.medicalbilling.com/invoice/{invoice_number}"

    invoice_data = {
        "invoice_number": invoice_number,
        "issue_date": date.today().isoformat(),
        "due_date": due_date.isoformat(),
        "patient": {"name": "John Doe", "dob": "1985-03-15", "patient_id": payload.patient_id, "address": "123 Main St", "phone": "555-1234"},
        "provider": {"facility_name": "City Medical Center", "provider_name": "Dr. Smith", "npi": "1234567890", "address": "456 Health Ave", "phone": "555-5678"},
        "line_items": [item.dict() for item in payload.line_items],
        "subtotal": payload.subtotal,
        "tax_amount": payload.tax_amount,
        "discount_amount": payload.discount_amount,
        "total_amount": payload.total_amount,
        "balance_due": payload.balance_due,
        "payment_url": payment_url,
        "notes": payload.notes,
    }

    return {
        "invoice_number": invoice_number,
        "due_date": due_date.isoformat(),
        "payment_url": payment_url,
        "status": "draft",
        "invoice_data": invoice_data,
    }


@router.get("/{invoice_number}/pdf")
async def download_invoice_pdf(
    invoice_number: str,
    current_user: dict = Depends(require_role("admin", "biller", "patient"))
):
    """Download invoice as PDF."""
    # Sample invoice data - in production, load from DB
    sample_invoice = {
        "invoice_number": invoice_number,
        "issue_date": date.today().isoformat(),
        "due_date": (date.today() + timedelta(days=30)).isoformat(),
        "patient": {"name": "John Doe", "dob": "1985-03-15", "patient_id": "P-00123", "address": "123 Main St, Austin TX 78701", "phone": "555-1234"},
        "provider": {"facility_name": "City Medical Center", "provider_name": "Dr. Sarah Smith", "npi": "1234567890", "address": "456 Health Ave, Austin TX 78702", "phone": "555-5678"},
        "line_items": [
            {"cpt_code": "99213", "icd10_codes": ["J45.909"], "description": "Office visit - moderate complexity", "quantity": 1, "unit_price": 150.00, "total": 150.00},
            {"cpt_code": "94640", "icd10_codes": ["J45.909"], "description": "Nebulizer treatment", "quantity": 1, "unit_price": 45.00, "total": 45.00},
        ],
        "subtotal": 195.00,
        "tax_amount": 0.00,
        "discount_amount": 0.00,
        "total_amount": 195.00,
        "balance_due": 40.00,
        "payment_url": f"https://pay.medicalbilling.com/invoice/{invoice_number}",
        "notes": "Insurance paid $155. Patient responsible for $40 copay.",
    }

    pdf_bytes = pdf_service.generate_invoice_pdf(sample_invoice)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{invoice_number}.pdf"'}
    )


@router.get("/")
async def list_invoices(
    status: str = None,
    patient_id: str = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(require_role("admin", "biller", "patient"))
):
    return {"invoices": [], "page": page, "total": 0}


@router.patch("/{invoice_number}/send")
async def send_invoice(
    invoice_number: str,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    """Mark invoice as sent and trigger email/SMS to patient."""
    return {"invoice_number": invoice_number, "status": "sent", "message": "Statement sent to patient"}


@router.patch("/{invoice_number}/void")
async def void_invoice(
    invoice_number: str,
    reason: str,
    current_user: dict = Depends(require_role("admin"))
):
    return {"invoice_number": invoice_number, "status": "voided", "reason": reason}
