from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models_db import Formation, Well
from apps.api.schemas import FormationInterval

router = APIRouter(prefix="/formations", tags=["Formations"])

@router.get("/current")
def get_current_formation(
    well_id: str = Query(..., description="Well ID"),
    depth: float = Query(..., description="Current measured depth in meters"),
    db: Session = Depends(get_db)
):
    formation = db.query(Formation).filter(
        Formation.well_id == well_id,
        Formation.top_md <= depth,
        Formation.bottom_md >= depth
    ).first()
    
    if not formation:
        # Fallback to closest formation interval
        formation = db.query(Formation).filter(Formation.well_id == well_id).order_by(Formation.top_md.asc()).first()
        
    if not formation:
        return {
            "well_id": well_id,
            "depth": depth,
            "formation_name": "Tipam Sandstone",
            "lithology": "Sandstone",
            "pore_pressure_gradient": 1.18,
            "fracture_gradient": 1.82,
            "provenance": "SYNTHETIC"
        }
        
    return {
        "well_id": well_id,
        "depth": depth,
        "formation_name": formation.formation_name,
        "top_md": formation.top_md,
        "bottom_md": formation.bottom_md,
        "lithology": formation.lithology,
        "pore_pressure_gradient": formation.pore_pressure_gradient,
        "fracture_gradient": formation.fracture_gradient,
        "pressure_context": formation.pressure_context,
        "provenance": formation.provenance
    }
