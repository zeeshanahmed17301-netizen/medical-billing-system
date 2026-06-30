"""
Medical Billing Automation System - FastAPI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger

from app.api import (
    auth, bills, invoices, claims, payments,
    denials, patients, providers, dashboard, statements
)
from app.utils.config import settings

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Medical Billing Automation API",
    description="HIPAA-compliant AI-powered medical billing system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Register routers
app.include_router(auth.router,       prefix="/api/auth",       tags=["Auth"])
app.include_router(bills.router,      prefix="/api/bills",      tags=["Bills"])
app.include_router(invoices.router,   prefix="/api/invoices",   tags=["Invoices"])
app.include_router(claims.router,     prefix="/api/claims",     tags=["Claims"])
app.include_router(payments.router,   prefix="/api/payments",   tags=["Payments"])
app.include_router(denials.router,    prefix="/api/denials",    tags=["Denials"])
app.include_router(patients.router,   prefix="/api/patients",   tags=["Patients"])
app.include_router(providers.router,  prefix="/api/providers",  tags=["Providers"])
app.include_router(dashboard.router,  prefix="/api/dashboard",  tags=["Dashboard"])
app.include_router(statements.router, prefix="/api/statements", tags=["Statements"])

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "medical-billing-api"}

@app.on_event("startup")
async def startup_event():
    logger.info("Medical Billing API starting up...")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Medical Billing API shutting down...")
