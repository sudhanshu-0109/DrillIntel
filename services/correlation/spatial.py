import math
from typing import List, Dict, Any, Optional

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in kilometers.
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 3)

def calculate_azimuth(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate azimuth from point 1 to point 2 in degrees (0 - 360).
    """
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    diff_lon = math.radians(lon2 - lon1)

    x = math.sin(diff_lon) * math.cos(lat2_rad)
    y = math.cos(lat1_rad) * math.sin(lat2_rad) - (math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(diff_lon))
    initial_bearing = math.atan2(x, y)
    initial_bearing = math.degrees(initial_bearing)
    compass_bearing = (initial_bearing + 360) % 360
    return round(compass_bearing, 1)

def calculate_depth_overlap(well1_depth: float, well1_max: float, well2_min: float, well2_max: float) -> float:
    """
    Calculate the overlap in meters between well1 current exploration zone and well2 total depth.
    """
    zone_top = max(0.0, well1_depth - 300.0)
    zone_bottom = min(well1_max, well1_depth + 300.0)
    
    overlap_start = max(zone_top, well2_min)
    overlap_end = min(zone_bottom, well2_max)
    
    if overlap_end > overlap_start:
        return round(overlap_end - overlap_start, 1)
    return 0.0

def calculate_offset_relevance(
    active_lat: float,
    active_lon: float,
    active_depth: float,
    active_td: float,
    active_formation: str,
    offset_lat: float,
    offset_lon: float,
    offset_td: float,
    offset_formations: List[str],
    offset_events_in_formation: int,
    offset_trajectory_deviation: float = 120.0
) -> Dict[str, Any]:
    """
    Multi-criteria geological & spatial relevance scoring as mandated by NWIS research plan.
    Weights:
    - Distance proximity: 25%
    - Formation similarity: 25%
    - Depth overlap: 20%
    - Trajectory / 3D proximity: 15%
    - Historical event relevance: 15%
    """
    dist_km = haversine_distance(active_lat, active_lon, offset_lat, offset_lon)
    azimuth = calculate_azimuth(active_lat, active_lon, offset_lat, offset_lon)
    
    # 1. Distance score (exponential decay over 15 km)
    dist_score = max(0.0, 1.0 - (dist_km / 15.0))
    
    # 2. Formation similarity
    has_exact_formation = active_formation.lower() in [f.lower() for f in offset_formations]
    formation_score = 1.0 if has_exact_formation else 0.4
    
    # 3. Depth overlap
    depth_overlap = calculate_depth_overlap(active_depth, active_td, 0.0, offset_td)
    depth_score = min(1.0, depth_overlap / 500.0) if depth_overlap > 0 else 0.2
    
    # 4. Trajectory proximity (closer 3D distance yields higher score)
    traj_score = max(0.0, 1.0 - (offset_trajectory_deviation / 500.0))
    
    # 5. Historical event relevance (wells with relevant problem events in the same zone provide vital institutional memory)
    event_score = min(1.0, 0.3 + (offset_events_in_formation * 0.35))
    
    # Composite score (0 - 100)
    composite = (
        dist_score * 25.0 +
        formation_score * 25.0 +
        depth_score * 20.0 +
        traj_score * 15.0 +
        event_score * 15.0
    )
    
    return {
        "distance_km": dist_km,
        "azimuth_deg": azimuth,
        "depth_overlap_m": depth_overlap,
        "formation_similarity": round(formation_score, 2),
        "trajectory_proximity_m": round(offset_trajectory_deviation, 1),
        "historical_event_count": offset_events_in_formation,
        "relevance_score": round(composite, 1)
    }
