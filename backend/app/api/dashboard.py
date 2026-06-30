from fastapi import APIRouter, Depends
from app.utils.auth import require_role

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(require_role("admin", "biller"))):
    """Dashboard KPIs - connect to DB for real data."""
    return {
        "total_bills_uploaded": 142,
        "pending_extraction": 3,
        "invoices_generated": 89,
        "invoices_paid": 54,
        "invoices_overdue": 12,
        "total_revenue": 42850.00,
        "claims_submitted": 78,
        "claims_approved": 61,
        "claims_denied": 8,
        "claims_pending": 9,
        "denial_rate_pct": 10.3,
        "avg_days_to_payment": 18.4,
        "ar_over_90_days": 4200.00,
        "monthly_revenue": [
            {"month": "Jan", "revenue": 8200},
            {"month": "Feb", "revenue": 9100},
            {"month": "Mar", "revenue": 7800},
            {"month": "Apr", "revenue": 10200},
            {"month": "May", "revenue": 7550},
        ],
        "claims_by_status": {
            "approved": 61,
            "denied": 8,
            "pending": 9,
        }
    }
