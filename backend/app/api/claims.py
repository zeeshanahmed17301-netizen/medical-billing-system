"""
Insurance Claims API
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.utils.auth import require_role
from app.services.ai_service import ai_service
from app.services.pdf_service import pdf_service
from fastapi.responses import Response

router = APIRouter()


class ClaimSubmit(BaseModel):
    invoice_id: str
    patient_insurance_id: str
    form_type: str = "CMS-1500"
    diagnosis_codes: List[str]
    procedure_codes: List[str]
    date_of_service: str
    total_billed: float
    provider_npi: str
    facility_npi: Optional[str] = None


@router.post("/submit")
async def submit_claim(
    payload: ClaimSubmit,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    """Auto-generate and submit an insurance claim."""
    import uuid
    claim_number = f"CLM-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

    # Auto-build CMS-1500 fields
    cms1500 = {
        "claim_number": claim_number,
        "form_type": payload.form_type,
        "box_21_diagnosis_codes": payload.diagnosis_codes,
        "box_24_service_lines": payload.procedure_codes,
        "box_28_total_charge": payload.total_billed,
        "box_33_billing_provider_npi": payload.provider_npi,
        "box_14_date_of_service": payload.date_of_service,
        "submission_timestamp": datetime.utcnow().isoformat(),
    }

    return {
        "claim_number": claim_number,
        "status": "submitted",
        "form_type": payload.form_type,
        "total_billed": payload.total_billed,
        "claim_data": cms1500,
        "message": "Claim submitted to payer (mock). Connect Change Healthcare API for live submission.",
    }


@router.post("/{claim_id}/post-eob")
async def post_eob(
    claim_id: str,
    eob_data: dict,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    """Post EOB (Explanation of Benefits) and reconcile payment."""
    allowed = eob_data.get("allowed_amount", 0)
    paid = eob_data.get("paid_amount", 0)
    patient_resp = eob_data.get("patient_responsibility", 0)
    denial_reason = eob_data.get("denial_reason", "")

    result = {
        "claim_id": claim_id,
        "allowed_amount": allowed,
        "paid_amount": paid,
        "patient_responsibility": patient_resp,
        "adjustment_amount": allowed - paid,
        "status": "approved" if paid > 0 else "denied",
    }

    if denial_reason:
        result["status"] = "denied"
        result["denial_reason"] = denial_reason

    return result


@router.get("/{claim_id}")
async def get_claim(
    claim_id: str,
    current_user: dict = Depends(require_role("admin", "biller", "coder"))
):
    return {"claim_id": claim_id, "message": "Connect to DB for real claim data"}


@router.get("/{claim_id}/pdf")
async def download_claim_pdf(
    claim_id: str,
    current_user: dict = Depends(require_role("admin", "biller", "coder"))
):
    """Download claim as PDF."""
    sample_claim = {
        "claim_id": claim_id,
        "patient_name": "John Doe",
        "provider_name": "City Medical Center",
        "total_charge": 195.00,
        "diagnoses": ["J45.909 - Unspecified asthma, uncomplicated"],
        "services": [
            {"cpt": "99213", "charge": 150.00},
            {"cpt": "94640", "charge": 45.00}
        ]
    }
    
    pdf_bytes = pdf_service.generate_claim_pdf(sample_claim)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{claim_id}.pdf"'}
    )


@router.get("/")
async def list_claims(
    status: str = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    return {"claims": [], "page": page, "total": 0}
