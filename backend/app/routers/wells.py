from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models_db import Well, Trajectory, Formation, Event, Document
from app.schemas import (
    WellDetail, WellBase, TrajectoryPoint, FormationInterval,
    EventItem, DocumentItem, OffsetWellRelevance
)
from app.services.correlation.spatial import calculate_offset_relevance, haversine_distance

router = APIRouter(prefix="/wells", tags=["Wells"])

@router.get("", response_model=List[WellBase])
def get_wells(
    field: Optional[str] = None,
    status: Optional[str] = None,
    provenance: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Well)
    if field:
        query = query.filter(Well.field == field)
    if status:
        query = query.filter(Well.status == status)
    if provenance:
        query = query.filter(Well.provenance == provenance)
    return query.all()

@router.get("/nearby", response_model=List[OffsetWellRelevance])
def get_nearby_offset_wells(
    well_id: Optional[str] = Query(None, description="Active reference well ID"),
    lat: Optional[float] = Query(None, description="Active latitude"),
    lng: Optional[float] = Query(None, description="Active longitude"),
    radius: float = Query(15.0, description="Search radius in kilometers"),
    db: Session = Depends(get_db)
):
    active_well = None
    if well_id:
        active_well = db.query(Well).filter(Well.well_id == well_id).first()
    
    if active_well:
        ref_lat = active_well.latitude
        ref_lon = active_well.longitude
        ref_depth = active_well.current_depth
        ref_td = active_well.total_depth_md
        ref_formation = active_well.current_formation
    elif lat is not None and lng is not None:
        ref_lat = lat
        ref_lon = lng
        ref_depth = 3280.0
        ref_td = 3850.0
        ref_formation = "Tipam Sandstone"
    else:
        # Default to NWIS-ASSAM-003
        default_w = db.query(Well).filter(Well.well_id == "NWIS-ASSAM-003").first()
        if default_w:
            ref_lat = default_w.latitude
            ref_lon = default_w.longitude
            ref_depth = default_w.current_depth
            ref_td = default_w.total_depth_md
            ref_formation = default_w.current_formation
            well_id = default_w.well_id
        else:
            raise HTTPException(status_code=400, detail="Reference well coordinates required")

    candidate_wells = db.query(Well).all()
    results = []

    for w in candidate_wells:
        if well_id and w.well_id == well_id:
            continue  # Skip active well itself

        dist_km = haversine_distance(ref_lat, ref_lon, w.latitude, w.longitude)
        if dist_km <= radius:
            # Gather formations for offset well
            f_names = [f.formation_name for f in w.formations]
            # Gather events in matching formation
            evt_count = db.query(Event).filter(
                Event.well_id == w.well_id,
                Event.formation.ilike(f"%{ref_formation[:5]}%")
            ).count()
            
            relevance = calculate_offset_relevance(
                active_lat=ref_lat,
                active_lon=ref_lon,
                active_depth=ref_depth,
                active_td=ref_td,
                active_formation=ref_formation,
                offset_lat=w.latitude,
                offset_lon=w.longitude,
                offset_td=w.total_depth_md,
                offset_formations=f_names,
                offset_events_in_formation=evt_count,
                offset_trajectory_deviation=round(dist_km * 40.0, 1) # Estimated 3D divergence
            )
            
            results.append(OffsetWellRelevance(
                well_id=w.well_id,
                well_name=w.well_name,
                field=w.field,
                distance_km=relevance["distance_km"],
                azimuth_deg=relevance["azimuth_deg"],
                depth_overlap_m=relevance["depth_overlap_m"],
                formation_similarity=relevance["formation_similarity"],
                trajectory_proximity_m=relevance["trajectory_proximity_m"],
                historical_event_count=relevance["historical_event_count"],
                relevance_score=relevance["relevance_score"],
                provenance=w.provenance,
                is_synthetic=w.is_synthetic,
                latitude=w.latitude,
                longitude=w.longitude,
                total_depth_md=w.total_depth_md,
                status=w.status
            ))

    # Sort by multi-criteria relevance score descending
    results.sort(key=lambda x: x.relevance_score, reverse=True)
    return results

@router.get("/{id}", response_model=WellDetail)
def get_well(id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == id).first()
    if not well:
        raise HTTPException(status_code=404, detail=f"Well {id} not found")
    return well

@router.get("/{id}/trajectory", response_model=List[TrajectoryPoint])
def get_well_trajectory(id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == id).first()
    if not well:
        raise HTTPException(status_code=404, detail=f"Well {id} not found")
    return db.query(Trajectory).filter(Trajectory.well_id == id).order_by(Trajectory.md.asc()).all()

@router.get("/{id}/formations", response_model=List[FormationInterval])
def get_well_formations(id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == id).first()
    if not well:
        raise HTTPException(status_code=404, detail=f"Well {id} not found")
    return db.query(Formation).filter(Formation.well_id == id).order_by(Formation.top_md.asc()).all()

@router.get("/{id}/events", response_model=List[EventItem])
def get_well_events(id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == id).first()
    if not well:
        raise HTTPException(status_code=404, detail=f"Well {id} not found")
    return db.query(Event).filter(Event.well_id == id).order_by(Event.depth_start.asc()).all()

@router.get("/{id}/documents", response_model=List[DocumentItem])
def get_well_documents(id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == id).first()
    if not well:
        raise HTTPException(status_code=404, detail=f"Well {id} not found")
    return db.query(Document).filter(Document.well_id == id).order_by(Document.created_at.desc()).all()
