"""
AI Extraction Service
Uses Claude to extract structured medical billing data from OCR text.
Returns fields with confidence scores.
"""
import json
import re
from typing import Optional
import anthropic
from loguru import logger
from app.utils.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

EXTRACTION_SYSTEM_PROMPT = """You are a medical billing specialist and expert coder.
Extract all medical billing information from the provided bill text.
Return ONLY a valid JSON object with no markdown, no explanation.

JSON structure:
{
  "patient": {
    "name": "",
    "patient_id": "",
    "dob": "",
    "address": "",
    "phone": "",
    "email": "",
    "_confidence": 0.0
  },
  "provider": {
    "name": "",
    "facility_name": "",
    "npi": "",
    "address": "",
    "phone": "",
    "_confidence": 0.0
  },
  "date_of_service": "",
  "date_of_service_confidence": 0.0,
  "diagnosis_codes": ["ICD-10 codes array"],
  "line_items": [
    {
      "cpt_code": "",
      "hcpcs_code": "",
      "icd10_codes": [],
      "description": "",
      "quantity": 1,
      "unit_price": 0.00,
      "total": 0.00,
      "_confidence": 0.0
    }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total_charged": 0.00,
  "overall_confidence": 0.0,
  "notes": ""
}

Rules:
- Fill empty string "" for missing text fields
- Fill 0.0 for missing numeric fields
- Use [] for missing arrays
- Confidence scores are 0.0-1.0 (1.0 = certain)
- ICD-10 format: letter + 2 digits + optional decimal (e.g., J45.909)
- CPT codes are 5-digit numbers (e.g., 99213)
- Dates in YYYY-MM-DD format
"""

CODING_SYSTEM_PROMPT = """You are a certified medical coder (CPC, CCS).
Given CPT and ICD-10 codes, validate their compatibility and suggest corrections.
Return ONLY valid JSON:
{
  "validations": [
    {
      "cpt_code": "",
      "icd10_code": "",
      "status": "passed|warning|failed",
      "issue": "",
      "suggestion": "",
      "drg_code": "",
      "drg_weight": 0.0
    }
  ],
  "overall_status": "passed|warning|failed",
  "summary": ""
}
"""

DENIAL_SYSTEM_PROMPT = """You are a medical billing denial management specialist.
Analyze the claim denial and provide actionable guidance.
Return ONLY valid JSON:
{
  "category": "coding_error|authorization_missing|eligibility|duplicate|timely_filing|medical_necessity|other",
  "analysis": "",
  "recommended_action": "auto_rebill|corrected_claim|appeal|write_off|human_review",
  "action_steps": [],
  "can_auto_resolve": false,
  "corrected_data": {}
}
"""


class AIExtractionService:

    def extract_bill_data(self, ocr_text: str) -> dict:
        """Extract structured billing data from OCR text using Claude."""
        try:
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                system=EXTRACTION_SYSTEM_PROMPT,
                messages=[
                    {
                        "role": "user",
                        "content": f"Extract all medical billing information from this bill:\n\n{ocr_text}"
                    }
                ]
            )
            raw = message.content[0].text.strip()
            # Strip potential markdown fences
            raw = re.sub(r"^```json\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
            data = json.loads(raw)
            logger.info(f"AI extraction complete. Confidence: {data.get('overall_confidence', 'N/A')}")
            return data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI extraction JSON: {e}")
            return self._empty_extraction()
        except Exception as e:
            logger.error(f"AI extraction error: {e}")
            return self._empty_extraction()

    def validate_codes(self, line_items: list) -> dict:
        """Validate CPT/ICD-10 code compatibility using Claude."""
        try:
            payload = json.dumps({"line_items": line_items})
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1500,
                system=CODING_SYSTEM_PROMPT,
                messages=[
                    {
                        "role": "user",
                        "content": f"Validate these medical codes:\n{payload}"
                    }
                ]
            )
            raw = message.content[0].text.strip()
            raw = re.sub(r"^```json\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
            return json.loads(raw)
        except Exception as e:
            logger.error(f"Code validation error: {e}")
            return {"validations": [], "overall_status": "error", "summary": str(e)}

    def analyze_denial(self, denial_code: str, denial_reason: str, claim_data: dict) -> dict:
        """Analyze a claim denial and suggest corrective action."""
        try:
            prompt = (
                f"Denial Code: {denial_code}\n"
                f"Denial Reason: {denial_reason}\n"
                f"Claim Data: {json.dumps(claim_data, indent=2)}"
            )
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1500,
                system=DENIAL_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}]
            )
            raw = message.content[0].text.strip()
            raw = re.sub(r"^```json\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
            return json.loads(raw)
        except Exception as e:
            logger.error(f"Denial analysis error: {e}")
            return {
                "category": "other",
                "analysis": str(e),
                "recommended_action": "human_review",
                "action_steps": [],
                "can_auto_resolve": False,
                "corrected_data": {}
            }

    def _empty_extraction(self) -> dict:
        return {
            "patient": {"name": "", "patient_id": "", "dob": "", "address": "", "_confidence": 0.0},
            "provider": {"name": "", "facility_name": "", "npi": "", "_confidence": 0.0},
            "date_of_service": "",
            "date_of_service_confidence": 0.0,
            "diagnosis_codes": [],
            "line_items": [],
            "subtotal": 0.0,
            "tax": 0.0,
            "total_charged": 0.0,
            "overall_confidence": 0.0,
            "notes": "Extraction failed - manual review required"
        }


ai_service = AIExtractionService()
