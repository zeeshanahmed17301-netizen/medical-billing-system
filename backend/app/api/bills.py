"""
Bills API - Upload, OCR extract, AI analyze doctor bills
"""
import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from loguru import logger

from app.utils.auth import require_role
from app.utils.config import settings
from app.services.ocr_service import ocr_service
from app.services.ai_service import ai_service

router = APIRouter()

ALLOWED_TYPES = {"pdf", "jpg", "jpeg", "png", "bmp", "tiff"}
MAX_SIZE_MB = 20


@router.post("/upload")
async def upload_bill(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role("admin", "biller"))
):
    """Upload a doctor's bill and trigger AI extraction."""
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(413, f"File too large. Max {MAX_SIZE_MB}MB.")

    bill_id = str(uuid.uuid4())
    upload_dir = Path(settings.LOCAL_UPLOAD_DIR) / "bills"
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{bill_id}.{ext}"

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)

    # Queue extraction in background
    background_tasks.add_task(process_bill, bill_id, contents, ext)

    return {
        "bill_id": bill_id,
        "filename": file.filename,
        "status": "uploaded",
        "message": "Bill uploaded. AI extraction started.",
    }


async def process_bill(bill_id: str, file_bytes: bytes, file_type: str):
    """Background task: OCR → AI extract → code validate."""
    try:
        logger.info(f"Processing bill {bill_id}")
        # 1. OCR
        raw_text = ocr_service.extract_text(file_bytes, file_type)
        # 2. AI Extraction
        extracted = ai_service.extract_bill_data(raw_text)
        # 3. Code Validation
        if extracted.get("line_items"):
            validation = ai_service.validate_codes(extracted["line_items"])
            extracted["code_validation"] = validation
        # In production: save to DB here
        logger.info(f"Bill {bill_id} processed. Confidence: {extracted.get('overall_confidence')}")
    except Exception as e:
        logger.error(f"Bill processing failed for {bill_id}: {e}")


@router.post("/extract-sync")
async def extract_bill_sync(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role("admin", "biller"))
):
    """Synchronous extraction - returns results immediately (for small files)."""
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    contents = await file.read()
    raw_text = ocr_service.extract_text(contents, ext)
    extracted = ai_service.extract_bill_data(raw_text)

    if extracted.get("line_items"):
        validation = ai_service.validate_codes(extracted["line_items"])
        extracted["code_validation"] = validation

    return {
        "status": "extracted",
        "ocr_text_length": len(raw_text),
        "extracted_data": extracted,
    }


@router.get("/{bill_id}")
async def get_bill(
    bill_id: str,
    current_user: dict = Depends(require_role("admin", "biller", "coder"))
):
    """Get bill extraction status and data."""
    # In production: query DB
    return {"bill_id": bill_id, "status": "extracted", "message": "Query DB for real data"}


@router.patch("/{bill_id}/override")
async def override_extraction(
    bill_id: str,
    overrides: dict,
    current_user: dict = Depends(require_role("admin", "biller", "coder"))
):
    """Manual override of extracted fields."""
    # In production: update DB record, log audit
    return {"bill_id": bill_id, "overrides_applied": overrides, "status": "reviewed"}


@router.get("/")
async def list_bills(
    status: str = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(require_role("admin", "biller", "coder"))
):
    """List uploaded bills with optional status filter."""
    return {
        "bills": [],
        "page": page,
        "limit": limit,
        "total": 0,
        "message": "Connect to DB for real data"
    }
