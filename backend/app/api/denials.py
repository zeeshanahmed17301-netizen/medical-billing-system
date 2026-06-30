"""
Denial Management API
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.utils.auth import require_role
from app.services.ai_service import ai_service

router = APIRouter()


class DenialReport(BaseModel):
    claim_id: str
    denial_code: str
    denial_reason: str
    claim_data: dict


class DenialResolve(BaseModel):
    action_taken: str
    notes: Optional[str] = None


@router.post("/analyze")
async def analyze_denial(
    payload: DenialReport,
    current_user: dict = Depends(require_role("admin", "biller", "coder"))
):
    """AI analyzes a claim denial and suggests corrective action."""
    analysis = ai_service.analyze_denial(
        payload.denial_code,
        payload.denial_reason,
        payload.claim_data
    )
    return {
        "claim_id": payload.claim_id,
        "denial_code": payload.denial_code,
        "ai_analysis": analysis,
    }


@router.post("/{denial_id}/resolve")
async def resolve_denial(
    denial_id: str,
    payload: DenialResolve,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    return {
        "denial_id": denial_id,
        "action_taken": payload.action_taken,
        "status": "resolved",
        "resolved_by": current_user["user_id"],
    }


@router.post("/{denial_id}/escalate")
async def escalate_denial(
    denial_id: str,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    return {"denial_id": denial_id, "status": "escalated", "queue": "human_review"}


@router.get("/")
async def list_denials(
    resolved: bool = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(require_role("admin", "biller"))
):
    return {"denials": [], "page": page, "total": 0}
