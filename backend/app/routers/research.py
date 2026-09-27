"""
National Research Activity Router
=================================
REST endpoints for India-wide research manifest coverage, area intelligence,
spatial context queries, and administrative index refreshes.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models_db import User, AuditLog
from app.auth import get_current_user, require_roles
from app.services.research_ingestion import (
    research_catalog, NationalActivityArea, IngestionReport,
    RegionalDrillingContext, NationalCoverageSummary
)
from app.schemas import (
    ResearchAreaResponse, RegionalDrillingContextResponse,
    NationalCoverageSummaryResponse, ResearchIngestionRefreshResponse
)

router = APIRouter(prefix="/research", tags=["National Research Activity"])


@router.get("/coverage", response_model=NationalCoverageSummaryResponse, summary="National Data Coverage & Roadmap")
def get_national_coverage():
    """
    Returns nationwide research manifest coverage breakdown across all states,
    sedimentary basins, environments, and prioritized Data Acquisition Roadmap.
    """
    try:
        summary = research_catalog.generate_national_coverage_summary()
        return summary.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate coverage summary: {str(e)}")


@router.get("/areas", response_model=List[ResearchAreaResponse], summary="List / Search National Research Areas")
def list_research_areas(
    q: Optional[str] = Query(None, description="Free text search query"),
    basin: Optional[str] = Query(None, description="Filter by sedimentary basin"),
    state: Optional[str] = Query(None, description="Filter by state or region"),
    priority: Optional[str] = Query(None, description="Filter by NWIS data priority (VERY_HIGH, HIGH, MEDIUM, LOW)"),
    tier: Optional[str] = Query(None, description="Filter by operational activity tier")
):
    """
    Returns filtered list of normalized research manifest areas.
    """
    try:
        areas = research_catalog.search_areas(
            query=q,
            basin=basin,
            state=state,
            priority=priority,
            tier=tier
        )
        return [a.to_dict() for a in areas]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search research areas: {str(e)}")


@router.get("/areas/{area_id}", response_model=ResearchAreaResponse, summary="Get Area by ID")
def get_research_area(area_id: str):
    """
    Get detailed intelligence for a specific research manifest area by ID.
    """
    area = research_catalog.get_area_by_id(area_id)
    if not area:
        raise HTTPException(status_code=404, detail=f"Research area with ID '{area_id}' not found.")
    return area.to_dict()


@router.get("/context", response_model=RegionalDrillingContextResponse, summary="Get Research Context for Coordinates")
def get_research_context(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    location_name: Optional[str] = Query(None, description="Optional place name"),
    basin: Optional[str] = Query(None, description="Optional basin override")
):
    """
    Returns regional drilling context from the national research manifest for a given coordinate.
    """
    try:
        ctx = research_catalog.build_regional_context(
            lat=lat,
            lng=lng,
            basin_name=basin,
            location_name=location_name
        )
        return ctx.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve research context: {str(e)}")


@router.get("/basin/{basin_name}", response_model=List[ResearchAreaResponse], summary="Get Areas in Basin")
def get_areas_by_basin(basin_name: str):
    """
    Returns all research manifest areas associated with a sedimentary basin.
    """
    areas = research_catalog.search_areas(basin=basin_name)
    return [a.to_dict() for a in areas]


@router.get("/state/{state_name}", response_model=List[ResearchAreaResponse], summary="Get Areas in State")
def get_areas_by_state(state_name: str):
    """
    Returns all research manifest areas associated with an Indian state.
    """
    areas = research_catalog.search_areas(state=state_name)
    return [a.to_dict() for a in areas]


@router.post("/refresh", response_model=ResearchIngestionRefreshResponse, summary="Refresh Research Index")
def refresh_research_index(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin-only endpoint to re-scan researchFiles/, validate, normalize,
    deduplicate, and synchronize with SQLite research_areas table.
    """
    try:
        report = research_catalog.initialize_index(db=db)

        # Log audit action
        audit = AuditLog(
            user_id=current_user.id,
            username=current_user.username,
            action="REFRESH_RESEARCH_INDEX",
            entity_type="research_manifest",
            entity_id=report.snapshot_version,
            details={
                "total_records": report.total_records,
                "added": report.added,
                "updated": report.updated,
                "unchanged": report.unchanged,
                "status": report.status
            }
        )
        db.add(audit)
        db.commit()

        return report.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to refresh research index: {str(e)}")
