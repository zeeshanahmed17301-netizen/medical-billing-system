from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Medical Billing System"
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION_VERY_LONG_SECRET_KEY"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://billing_user:billing_pass@localhost:5432/medical_billing"

    # Redis (Celery)
    REDIS_URL: str = "redis://localhost:6379/0"

    # OCR / AI
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    TESSERACT_CMD: str = "/usr/bin/tesseract"

    # Storage (S3 or local)
    STORAGE_BACKEND: str = "local"   # "local" or "s3"
    LOCAL_UPLOAD_DIR: str = "./uploads"
    S3_BUCKET: str = ""
    AWS_ACCESS_KEY: str = ""
    AWS_SECRET_KEY: str = ""
    AWS_REGION: str = "us-east-1"

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # PayPal
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "billing@medicalbilling.com"

    # SMS (Twilio)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    # Collection agency
    COLLECTION_THRESHOLD_DAYS: int = 90
    COLLECTION_API_URL: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
