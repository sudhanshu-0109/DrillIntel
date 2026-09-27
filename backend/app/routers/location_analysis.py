"""
Location Analysis Router
=========================
POST /api/location-analysis   → full Engineering Brief for a proposed location
GET  /api/location-analysis/geocode?q=...  → geocode a place name (via Nominatim)
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
import httpx

from app.services.location_analysis.location_service import location_service

router = APIRouter(prefix="/location-analysis", tags=["Location Analysis"])


# ── Request / Response schemas ────────────────────────────────────────────

class LocationAnalysisRequest(BaseModel):
    lat: float = Field(..., description="Proposed drilling latitude")
    lng: float = Field(..., description="Proposed drilling longitude")
    planned_depth_m: float = Field(..., ge=100.0, le=12000.0,
                                    description="Planned total depth in meters")
    location_name: Optional[str] = Field(None, description="Human-readable location name")


class GeocodeResult(BaseModel):
    display_name: str
    lat: float
    lng: float
    place_type: str


# ── Endpoints ────────────────────────────────────────────────────────────

@router.post("", summary="Analyze proposed drilling location")
def analyze_location(req: LocationAnalysisRequest):
    """
    Orchestrates nearby-well discovery, depth-aware formation analysis,
    historical event mining, and document evidence retrieval.
    Returns a complete Engineering Brief.
    """
    if not (-90 <= req.lat <= 90) or not (-180 <= req.lng <= 180):
        raise HTTPException(status_code=422, detail="Invalid coordinates")

    try:
        result = location_service.analyze(
            lat=req.lat,
            lng=req.lng,
            planned_depth_m=req.planned_depth_m,
            location_name=req.location_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/geocode", response_model=list, summary="Geocode a place name")
async def geocode_place(q: str = Query(..., min_length=2, description="Place name to geocode")):
    """
    Geocode a place name using OpenStreetMap Nominatim API.
    Returns up to 5 candidate locations with lat/lng.
    """
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": q,
                    "format": "json",
                    "limit": 5,
                    "countrycodes": "in",   # Prioritise India results
                    "addressdetails": 0
                },
                headers={"User-Agent": "eRTMAC-NWIS/1.0 (Oil India Limited SIH26121)"}
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data:
                results.append({
                    "display_name": item.get("display_name", ""),
                    "lat": float(item["lat"]),
                    "lng": float(item["lon"]),
                    "place_type": item.get("type", "place")
                })
            return results
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Geocoding service unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocoding failed: {str(e)}")
