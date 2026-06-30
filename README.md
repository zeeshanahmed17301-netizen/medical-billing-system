# 🏥 MedBill — AI Medical Billing Automation System

A full-stack, HIPAA-aware medical billing system powered by Claude AI.  
Handles the complete billing lifecycle: bill upload → OCR → AI extraction → invoice generation → insurance claims → payment → denial management → patient follow-up.

---

## 📁 Project Structure

```
medical-billing-system/
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                 # App entry point, router registration
│   │   ├── api/
│   │   │   ├── auth.py             # JWT login/register
│   │   │   ├── bills.py            # Upload + OCR + AI extraction
│   │   │   ├── invoices.py         # Invoice generation + PDF
│   │   │   ├── claims.py           # CMS-1500 / UB-04 claim submission
│   │   │   ├── payments.py         # Stripe + manual payments
│   │   │   ├── denials.py          # AI denial analysis
│   │   │   ├── patients.py         # Patient management
│   │   │   ├── providers.py        # Provider management
│   │   │   ├── dashboard.py        # KPI stats
│   │   │   └── statements.py       # Patient statements + collections
│   │   ├── services/
│   │   │   ├── ocr_service.py      # Tesseract OCR (PDF + image)
│   │   │   ├── ai_service.py       # Claude AI extraction + validation
│   │   │   └── invoice_service.py  # ReportLab PDF generation + QR codes
│   │   └── utils/
│   │       ├── config.py           # Pydantic settings (.env)
│   │       ├── database.py         # SQLAlchemy async engine
│   │       └── auth.py             # JWT + RBAC helpers
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                       # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                 # Full SPA: routing, all pages, components
│   │   └── main.jsx                # React DOM entry
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   └── schema.sql                  # Full PostgreSQL schema (UUID PKs, JSONB, enums)
│
├── docs/
│   └── MedBilling_API.postman_collection.json
│
├── sample-data/
│   └── sample_doctor_bill.json     # Sample bill + expected extraction output
│
├── docker-compose.yml              # PostgreSQL + Redis + backend + frontend
└── README.md
```

---

## ⚡ Quick Start

### Option A — Docker (recommended)

```bash
git clone <repo>
cd medical-billing-system

# 1. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env — add your ANTHROPIC_API_KEY and STRIPE_SECRET_KEY

# 2. Start all services
docker-compose up --build

# App running at:
#   Frontend  →  http://localhost:3000
#   API docs  →  http://localhost:8000/api/docs
```

### Option B — Local Development

**Backend**
```bash
cd backend

# Install system dependency (Ubuntu/Debian)
sudo apt install tesseract-ocr

# Python setup
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure
cp .env.example .env              # fill in your API keys

# Database (PostgreSQL must be running)
psql -U postgres -c "CREATE DATABASE medical_billing;"
psql -U billing_user -d medical_billing -f ../database/schema.sql

# Run
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                       # http://localhost:3000
```

---

## 🔑 API Keys Required

| Service | Purpose | Where to get |
|---|---|---|
| `ANTHROPIC_API_KEY` | AI extraction, code validation, denial analysis | https://console.anthropic.com |
| `STRIPE_SECRET_KEY` | Online payments | https://dashboard.stripe.com |
| `TWILIO_*` | SMS statements | https://twilio.com |
| `SMTP_*` | Email statements | Gmail App Password or SendGrid |

---

## 🧭 Demo Login Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@billing.com | admin123 |
| Biller | biller@billing.com | biller123 |
| Coder | coder@billing.com | coder123 |
| Patient | patient@example.com | patient123 |

---

## 🔄 Full Billing Workflow

```
1. Biller uploads Dr_Smith_bill.pdf
        ↓
2. Tesseract OCR extracts raw text
        ↓
3. Claude AI parses: patient, provider, CPT codes, ICD-10, charges
   (with per-field confidence scores)
        ↓
4. Biller reviews extraction — override any field manually
        ↓
5. Claude validates CPT ↔ ICD-10 compatibility, assigns DRG
        ↓
6. System generates INV-202406-XXXXXX (PDF with QR code)
        ↓
7. CMS-1500 claim auto-submitted to payer
        ↓
8. EOB received → AI reconciles: allowed $155, patient owes $40
        ↓
9. Patient emailed/SMS'd statement with $40 balance + pay link
        ↓
10. If unpaid 60d → reminder | 90d → auto-send to collection agency
```

---

## 🗄️ Database Tables

| Table | Purpose |
|---|---|
| `users` | All user accounts with roles |
| `patients` | Patient demographics (SSN encrypted) |
| `patient_insurance` | Primary/secondary insurance per patient |
| `providers` | Provider NPI, taxonomy, facility |
| `uploaded_bills` | Raw bill files + OCR text |
| `extracted_bills` | AI-extracted structured data + confidence |
| `coding_validations` | CPT/ICD-10 validation results + DRG |
| `invoices` | Patient invoices with line items (JSONB) |
| `insurance_claims` | CMS-1500/UB-04 claim records + EOB |
| `claim_denials` | Denial categorization + AI corrective action |
| `payments` | All payment transactions (Stripe, check, etc.) |
| `patient_statements` | Email/SMS statement log |
| `audit_logs` | HIPAA audit trail for every data change |

---

## 🛡️ Security & HIPAA Notes

- All PHI fields encrypted at rest (AES-256 at app layer)
- HTTPS enforced in production (TLS termination at load balancer)
- JWT tokens with 60-minute expiry
- Role-based access control on every endpoint
- Full audit log for every financial data change
- No PHI in logs — use patient_id references only
- Stripe handles card data (PCI-DSS compliant)

---

## 🔌 API Endpoints Summary

```
POST   /api/auth/token                    Login → JWT
POST   /api/bills/upload                  Upload bill (async extract)
POST   /api/bills/extract-sync            Upload + extract synchronously
PATCH  /api/bills/{id}/override           Manual field override

POST   /api/invoices/generate             Generate invoice from extracted bill
GET    /api/invoices/{number}/pdf         Download invoice PDF
PATCH  /api/invoices/{number}/send        Send statement to patient

POST   /api/claims/submit                 Submit CMS-1500 claim
POST   /api/claims/{id}/post-eob          Post EOB + reconcile

POST   /api/denials/analyze               AI analyze denial
POST   /api/denials/{id}/resolve          Mark denial resolved

POST   /api/payments/create-intent        Stripe payment intent
POST   /api/payments/webhook              Stripe webhook handler
POST   /api/payments/record               Manual payment entry

GET    /api/dashboard/stats               KPI overview

POST   /api/statements/send               Send email/SMS statement
POST   /api/statements/collection-escalate  Escalate to collection agency
```

Full interactive docs: **http://localhost:8000/api/docs**

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy (async) |
| AI | Claude claude-sonnet-4-20250514 (extraction, validation, denials) |
| OCR | Tesseract 5 + PyMuPDF (PDF text + fallback OCR) |
| Database | PostgreSQL 16 (JSONB for flexible billing data) |
| Queue | Redis + Celery (async bill processing) |
| Payments | Stripe Connect |
| PDF | ReportLab + qrcode |
| Frontend | React 18, Vite, Recharts, React Router |
| Deploy | Docker Compose |

---

## 🧪 Testing with Postman

1. Import `docs/MedBilling_API.postman_collection.json`
2. Run **Login (Admin)** first — token auto-saved to collection variable
3. All other requests use Bearer token automatically

---

## 📈 Scaling to 10k+ Bills/Month

- Enable Celery workers: `celery -A app.worker worker --concurrency=8`
- Add PostgreSQL read replicas for reporting queries
- Use S3 for file storage (`STORAGE_BACKEND=s3` in .env)
- Deploy behind AWS ALB with auto-scaling ECS tasks
