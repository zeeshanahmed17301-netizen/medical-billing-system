-- ============================================================
-- Medical Billing Automation System - PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────
-- USERS & ROLES
-- ─────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'biller', 'coder', 'patient', 'insurer');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'patient',
    phone           VARCHAR(20),
    is_active       BOOLEAN DEFAULT TRUE,
    mfa_enabled     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    table_name  VARCHAR(100),
    record_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PATIENTS
-- ─────────────────────────────────────────
CREATE TABLE patients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    patient_id      VARCHAR(50) UNIQUE NOT NULL,  -- external patient ID
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    dob             DATE NOT NULL,
    gender          VARCHAR(20),
    ssn_encrypted   TEXT,   -- encrypted at app layer (HIPAA)
    address_line1   VARCHAR(255),
    address_line2   VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(50),
    zip             VARCHAR(20),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE patient_insurance (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id          UUID REFERENCES patients(id),
    priority            INTEGER DEFAULT 1,  -- 1=primary, 2=secondary
    payer_name          VARCHAR(255) NOT NULL,
    payer_id            VARCHAR(100),
    member_id           VARCHAR(100) NOT NULL,
    group_number        VARCHAR(100),
    plan_name           VARCHAR(255),
    policy_holder       VARCHAR(255),
    effective_date      DATE,
    termination_date    DATE,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PROVIDERS
-- ─────────────────────────────────────────
CREATE TABLE providers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npi             VARCHAR(20) UNIQUE NOT NULL,
    facility_name   VARCHAR(255) NOT NULL,
    provider_name   VARCHAR(255) NOT NULL,
    specialty       VARCHAR(255),
    tax_id          VARCHAR(50),
    address_line1   VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(50),
    zip             VARCHAR(20),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    taxonomy_code   VARCHAR(20),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- UPLOADED BILLS (RAW)
-- ─────────────────────────────────────────
CREATE TYPE bill_status AS ENUM ('uploaded','processing','extracted','reviewed','invoiced','error');

CREATE TABLE uploaded_bills (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by         UUID REFERENCES users(id),
    original_filename   VARCHAR(500) NOT NULL,
    file_path           TEXT NOT NULL,       -- S3 / local encrypted path
    file_type           VARCHAR(20),         -- pdf, jpg, png
    file_size_bytes     INTEGER,
    status              bill_status DEFAULT 'uploaded',
    ocr_raw_text        TEXT,
    extraction_json     JSONB,              -- raw extracted fields + confidence
    error_message       TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- EXTRACTED BILL DATA
-- ─────────────────────────────────────────
CREATE TABLE extracted_bills (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id                 UUID REFERENCES uploaded_bills(id),
    patient_id              UUID REFERENCES patients(id),
    provider_id             UUID REFERENCES providers(id),
    date_of_service         DATE,
    date_of_service_conf    FLOAT,
    patient_name            VARCHAR(255),
    patient_name_conf       FLOAT,
    diagnosis_codes         TEXT[],         -- ICD-10 codes
    procedure_codes         TEXT[],         -- CPT/HCPCS codes
    service_descriptions    TEXT[],
    line_items              JSONB,          -- [{cpt, icd10, desc, charge}]
    subtotal                NUMERIC(12,2),
    tax                     NUMERIC(12,2) DEFAULT 0,
    total_charged           NUMERIC(12,2),
    overall_confidence      FLOAT,
    manually_reviewed       BOOLEAN DEFAULT FALSE,
    reviewed_by             UUID REFERENCES users(id),
    reviewed_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CODE VALIDATION
-- ─────────────────────────────────────────
CREATE TYPE validation_status AS ENUM ('passed','warning','failed');

CREATE TABLE coding_validations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extracted_bill_id   UUID REFERENCES extracted_bills(id),
    cpt_code            VARCHAR(20),
    icd10_code          VARCHAR(20),
    status              validation_status DEFAULT 'passed',
    issue_description   TEXT,
    ai_suggestion       TEXT,
    drg_code            VARCHAR(20),
    drg_weight          FLOAT,
    resolved            BOOLEAN DEFAULT FALSE,
    resolved_by         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────
CREATE TYPE invoice_status AS ENUM ('draft','sent','paid','partial','overdue','collection','voided');

CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number      VARCHAR(50) UNIQUE NOT NULL,  -- INV-2024-00001
    extracted_bill_id   UUID REFERENCES extracted_bills(id),
    patient_id          UUID REFERENCES patients(id),
    provider_id         UUID REFERENCES providers(id),
    status              invoice_status DEFAULT 'draft',
    issue_date          DATE DEFAULT CURRENT_DATE,
    due_date            DATE,
    line_items          JSONB NOT NULL,
    subtotal            NUMERIC(12,2),
    tax_amount          NUMERIC(12,2) DEFAULT 0,
    discount_amount     NUMERIC(12,2) DEFAULT 0,
    total_amount        NUMERIC(12,2),
    amount_paid         NUMERIC(12,2) DEFAULT 0,
    balance_due         NUMERIC(12,2),
    pdf_path            TEXT,
    qr_code_url         TEXT,
    stripe_payment_intent TEXT,
    notes               TEXT,
    sent_at             TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INSURANCE CLAIMS
-- ─────────────────────────────────────────
CREATE TYPE claim_status AS ENUM ('draft','submitted','acknowledged','pending','approved','partially_approved','denied','appealed','closed');
CREATE TYPE claim_form_type AS ENUM ('CMS-1500','UB-04');

CREATE TABLE insurance_claims (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number        VARCHAR(100) UNIQUE,
    invoice_id          UUID REFERENCES invoices(id),
    patient_insurance_id UUID REFERENCES patient_insurance(id),
    form_type           claim_form_type DEFAULT 'CMS-1500',
    status              claim_status DEFAULT 'draft',
    claim_data          JSONB NOT NULL,    -- full CMS-1500 / UB-04 fields
    submitted_at        TIMESTAMPTZ,
    payer_claim_id      VARCHAR(100),     -- from payer after submission
    total_billed        NUMERIC(12,2),
    total_allowed       NUMERIC(12,2),
    total_paid          NUMERIC(12,2),
    patient_responsibility NUMERIC(12,2),
    adjustment_amount   NUMERIC(12,2),
    eob_received_at     TIMESTAMPTZ,
    eob_data            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- DENIALS
-- ─────────────────────────────────────────
CREATE TYPE denial_category AS ENUM ('coding_error','authorization_missing','eligibility','duplicate','timely_filing','medical_necessity','other');
CREATE TYPE denial_action AS ENUM ('auto_rebill','corrected_claim','appeal','write_off','human_review');

CREATE TABLE claim_denials (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id            UUID REFERENCES insurance_claims(id),
    denial_code         VARCHAR(50),
    denial_reason       TEXT,
    category            denial_category,
    ai_analysis         TEXT,
    recommended_action  denial_action,
    action_taken        denial_action,
    corrected_claim_id  UUID REFERENCES insurance_claims(id),
    escalated           BOOLEAN DEFAULT FALSE,
    resolved            BOOLEAN DEFAULT FALSE,
    resolved_at         TIMESTAMPTZ,
    resolved_by         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────
CREATE TYPE payment_method AS ENUM ('stripe','paypal','check','ach','cash','insurance');
CREATE TYPE payment_status AS ENUM ('pending','completed','failed','refunded');

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id          UUID REFERENCES invoices(id),
    patient_id          UUID REFERENCES patients(id),
    amount              NUMERIC(12,2) NOT NULL,
    method              payment_method NOT NULL,
    status              payment_status DEFAULT 'pending',
    transaction_id      VARCHAR(255),   -- Stripe/PayPal transaction ID
    gateway_response    JSONB,
    notes               TEXT,
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PATIENT STATEMENTS & FOLLOW-UPS
-- ─────────────────────────────────────────
CREATE TYPE statement_channel AS ENUM ('email','sms','mail');
CREATE TYPE followup_status AS ENUM ('pending','sent','failed','collection');

CREATE TABLE patient_statements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID REFERENCES invoices(id),
    patient_id      UUID REFERENCES patients(id),
    channel         statement_channel,
    status          followup_status DEFAULT 'pending',
    amount_due      NUMERIC(12,2),
    message_body    TEXT,
    sent_at         TIMESTAMPTZ,
    days_overdue    INTEGER DEFAULT 0,
    is_collection   BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_claims_invoice_id ON insurance_claims(invoice_id);
CREATE INDEX idx_claims_status ON insurance_claims(status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_uploaded_bills_status ON uploaded_bills(status);
