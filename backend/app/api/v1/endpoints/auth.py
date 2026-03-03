from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, hash_token,
)
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.refresh_token import RefreshToken

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class LoginRequest(BaseModel):
    # Accept plain string for email to support local/special-use domains
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user_id: int
    email: str
    role: str

# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    is_first = db.query(User).count() == 0
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=UserRole.admin if is_first else UserRole.viewer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue_tokens(user, db)

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Check lockout
    if user.locked_until and user.locked_until > datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(status_code=423, detail="Account temporarily locked")
    if not verify_password(payload.password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            user.locked_until = (datetime.now(timezone.utc) + timedelta(minutes=15)).replace(tzinfo=None)
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Reset on success
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    return _issue_tokens(user, db)

@router.post("/refresh", response_model=TokenResponse)
def refresh(token: str = Query(...), db: Session = Depends(get_db)):
    token_hash = hash_token(token)
    stored = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.is_revoked == False,
    ).first()
    if not stored:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if stored.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(status_code=401, detail="Refresh token expired")
    stored.is_revoked = True
    db.commit()
    user = db.query(User).filter(User.id == stored.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return _issue_tokens(user, db)

@router.post("/logout")
def logout(token: str = Query(...), db: Session = Depends(get_db)):
    token_hash = hash_token(token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if stored:
        stored.is_revoked = True
        db.commit()
    return {"status": "ok"}

# ── Helpers ──────────────────────────────────────────────────────────────────

def _issue_tokens(user: User, db: Session) -> TokenResponse:
    access = create_access_token({"sub": user.email, "role": user.role.value})
    raw_refresh = create_refresh_token()
    expires = (datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)).replace(tzinfo=None)
    db.add(RefreshToken(user_id=user.id, token_hash=hash_token(raw_refresh), expires_at=expires))
    db.commit()
    return TokenResponse(
        access_token=access, refresh_token=raw_refresh,
        token_type="bearer", user_id=user.id,
        email=user.email, role=user.role.value,
    )
