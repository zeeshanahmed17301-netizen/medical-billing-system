from fastapi import APIRouter, Depends
from app.utils.auth import require_role

# Patients
router = APIRouter()

@router.get("/")
async def list_patients(page: int = 1, limit: int = 20, current_user: dict = Depends(require_role("admin", "biller"))):
    return {"patients": [], "page": page, "total": 0}

@router.get("/{patient_id}")
async def get_patient(patient_id: str, current_user: dict = Depends(require_role("admin", "biller", "patient"))):
    return {"patient_id": patient_id, "message": "Connect to DB"}

@router.post("/")
async def create_patient(payload: dict, current_user: dict = Depends(require_role("admin", "biller"))):
    return {"message": "Patient created", "data": payload}
