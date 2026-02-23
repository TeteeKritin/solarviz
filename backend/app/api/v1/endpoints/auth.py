from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.db.base import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token
)
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
import hashlib

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Email already registered")
    
    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role="admin" if not db.query(User).count() else "viewer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return _issue_tokens(user, db)

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    
    if not user:
        raise HTTPException(401, "Invalid credentials")
    
    # Check lockout
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(423, f"Account locked. Try again later.")
    
    if not verify_password(body.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
        db.commit()
        raise HTTPException(401, "Invalid credentials")
    
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    
    return _issue_tokens(user, db)

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(token: str, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    stored = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.is_revoked == False
    ).first()
    
    if not stored or stored.expires_at < datetime.now(timezone.utc):
        raise HTTPException(401, "Invalid or expired refresh token")
    
    stored.is_revoked = True
    db.commit()
    
    user = db.query(User).filter(User.id == stored.user_id).first()
    return _issue_tokens(user, db)

def _issue_tokens(user: User, db: Session) -> dict:
    access = create_access_token(user.email, user.role)
    raw_refresh, hashed_refresh = create_refresh_token()
    
    rt = RefreshToken(
        user_id=user.id,
        token_hash=hashed_refresh,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(rt)
    db.commit()
    
    return {
        "access_token": access,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
    }