from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from app.utils.auth import hash_password, verify_password, create_access_token

router = APIRouter()

# Mock user store - replace with DB
MOCK_USERS = {
    "admin@billing.com": {"id": "u-001", "role": "admin", "password": hash_password("admin123"), "name": "Admin User"},
    "biller@billing.com": {"id": "u-002", "role": "biller", "password": hash_password("biller123"), "name": "Jane Biller"},
    "patient@example.com": {"id": "u-003", "role": "patient", "password": hash_password("patient123"), "name": "John Doe"},
    "coder@billing.com": {"id": "u-004", "role": "coder", "password": hash_password("coder123"), "name": "Bob Coder"},
}


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "patient"


@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = MOCK_USERS.get(form_data.username)
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": user["id"], "role": user["role"], "email": form_data.username})
    return {"access_token": token, "token_type": "bearer", "role": user["role"], "name": user["name"]}


@router.post("/register")
async def register(payload: RegisterRequest):
    if payload.email in MOCK_USERS:
        raise HTTPException(400, "Email already registered")
    # In production: save to DB
    return {"message": "User registered successfully", "email": payload.email}


@router.get("/me")
async def get_me(token: str = Depends(lambda t: t)):
    return {"message": "Profile endpoint - connect to DB"}
