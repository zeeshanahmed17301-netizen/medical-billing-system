from fastapi import APIRouter, Depends
from app.utils.auth import require_role

router = APIRouter()

@router.get("/")
async def list_providers(current_user: dict = Depends(require_role("admin", "biller"))):
    return {"providers": []}

@router.get("/{provider_id}")
async def get_provider(provider_id: str, current_user: dict = Depends(require_role("admin", "biller"))):
    return {"provider_id": provider_id}

@router.post("/")
async def create_provider(payload: dict, current_user: dict = Depends(require_role("admin"))):
    return {"message": "Provider created", "data": payload}
