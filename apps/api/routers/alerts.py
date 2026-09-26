import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models_db import Alert
from apps.api.schemas import AlertItem, AlertAcknowledgeRequest
from apps.api.auth import get_current_user, User, record_audit

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertItem])
def get_alerts(
    well_id: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if well_id:
        query = query.filter(Alert.well_id == well_id)
    if status:
        query = query.filter(Alert.status == status)
    if severity:
        query = query.filter(Alert.severity == severity)
    return query.order_by(Alert.timestamp.desc()).all()

@router.get("/{id}", response_model=AlertItem)
def get_alert(id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {id} not found")
    return alert

@router.post("/{id}/acknowledge", response_model=AlertItem)
def acknowledge_alert(
    id: str,
    request: AlertAcknowledgeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.alert_id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {id} not found")
    
    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_by = current_user.full_name or current_user.username
    alert.acknowledged_at = datetime.datetime.utcnow()
    alert.resolution_notes = request.notes
    db.commit()
    db.refresh(alert)
    
    record_audit(db, current_user, "ACKNOWLEDGE_ALERT", "alert", alert.alert_id, {
        "well_id": alert.well_id,
        "notes": request.notes
    })
    
    return alert

@router.post("/{id}/resolve", response_model=AlertItem)
def resolve_alert(
    id: str,
    request: AlertAcknowledgeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.alert_id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {id} not found")
        
    alert.status = "RESOLVED"
    alert.resolution_notes = request.notes
    db.commit()
    db.refresh(alert)
    
    record_audit(db, current_user, "RESOLVE_ALERT", "alert", alert.alert_id, {
        "notes": request.notes
    })
    
    return alert
