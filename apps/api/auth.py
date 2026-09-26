import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from apps.api.config import settings
from apps.api.database import get_db
from apps.api.models_db import User, AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token", auto_error=False)

def get_password_hash(password: str) -> str:
    """
    PBKDF2-HMAC-SHA256 password hashing with random salt.
    Secure, standard, portable, and immune to bcrypt version mismatches.
    """
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return f"{salt}${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, expected_hash = hashed_password.split("$")
        calc_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        return secrets.compare_digest(calc_hash, expected_hash)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    # In Demo Mode, if no token is provided, fallback to demo drilling engineer
    if not token and settings.DEMO_MODE:
        demo_user = db.query(User).filter(User.username == "driller_piter").first()
        if demo_user:
            return demo_user
        return User(
            id=1,
            username="driller_piter",
            email="piter.engineer@oil-india.in",
            hashed_password="",
            full_name="Piter Saikia",
            role="DRILLING_ENGINEER",
            is_active=True
        )

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles and current_user.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {allowed_roles}"
            )
        return current_user
    return role_checker

def record_audit(db: Session, user: Optional[User], action: str, entity_type: str, entity_id: str, details: Optional[dict] = None):
    try:
        log = AuditLog(
            user_id=user.id if user else None,
            username=user.username if user else "system",
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {}
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed to record audit log: {e}")
