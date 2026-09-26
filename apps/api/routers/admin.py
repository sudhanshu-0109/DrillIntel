from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models_db import User, AuditLog, ModelMetadata, DataSource
from apps.api.schemas import UserResponse, ModelMetadataResponse, DataSourceResponse
from apps.api.auth import require_roles, get_current_user

router = APIRouter(tags=["Admin & Governance"])

@router.get("/api/admin/users", response_model=List[UserResponse])
def get_admin_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(User).all()

@router.get("/api/admin/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "username": l.username,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        } for l in logs
    ]

@router.get("/api/data-sources", response_model=List[DataSourceResponse])
def get_data_sources(db: Session = Depends(get_db)):
    return db.query(DataSource).all()

@router.get("/api/models", response_model=List[ModelMetadataResponse])
def get_models(db: Session = Depends(get_db)):
    return db.query(ModelMetadata).all()
