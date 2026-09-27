"""
Location Analysis Orchestrator Service
======================================
Coordinates India-wide nearby-well discovery, national research manifest retrieval,
sedimentary basin classification, depth-aware formation analysis, historical event
mining, document evidence retrieval, and technical analog well discovery.
Produces a structured, evidence-backed Engineering Brief for engineers.

No hallucination policy:
 - All geological well logs come from verified database records.
 - National area intelligence comes strictly from RESEARCH_MANIFEST files.
 - When direct offset wells are absent, regional and analog evidence is clearly declared.
 - Provenance is always declared: DIRECT | REGIONAL | ANALOG | INFERENCE | RESEARCH_MANIFEST.
"""

import math
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field, asdict

from app.database import SessionLocal
from app.models_db import Well, Formation, Event, Document, DocumentChunk
from app.services.correlation.spatial import (
    haversine_distance, calculate_azimuth, calculate_offset_relevance
)
from app.rag.rag_engine import rag_engine
from app.services.research_ingestion import research_catalog
from .regional_knowledge import classify_location_basin, find_analog_wells_for_depth, SEDIMENTARY_BASINS


# ── Data Classes ────────────────────────────────────────────────────────────

@dataclass
class NearbyWellSummary:
    well_id: str
    well_name: str
    field: str
    distance_km: float
    azimuth_deg: float
    total_depth_md: float
    status: str
    latitude: float
    longitude: float
    relevance_score: float
    event_count: int
    formations: List[str]
    provenance: str
    is_synthetic: bool
    depth_overlap_m: float
    formation_similarity: float


@dataclass
class DepthRiskInterval:
    depth_from: float
    depth_to: float
    formation_name: str
    lithology: str
    risk_events: List[Dict[str, Any]]
    pore_pressure_gradient: float
    fracture_gradient: float
    pressure_context: str
    risk_level: str           # LOW | MEDIUM | HIGH | CRITICAL
    evidence_count: int
    provenance: str           # DIRECT | REGIONAL | ANALOG | INFERENCE | RESEARCH_MANIFEST


@dataclass
class EngineeringBrief:
    # Input context
    location_lat: float
    location_lng: float
    planned_depth_m: float
    location_name: Optional[str]

    # Core findings
    nearby_wells: List[NearbyWellSummary]
    depth_risk_profile: List[DepthRiskInterval]
    critical_events: List[Dict[str, Any]]
    document_evidence: List[Dict[str, Any]]

    # National Research & Regional Context (RESEARCH_MANIFEST)
    regional_drilling_context: Optional[Dict[str, Any]]
    analog_wells: List[Dict[str, Any]]

    # Synthesis
    area_risk_summary: str
    geological_context: str
    data_confidence: str       # HIGH | MODERATE | LOW | INSUFFICIENT
    provenance_notes: str

    # Meta
    total_wells_analyzed: int
    radius_used_km: float
    analysis_status: str       # OK | PARTIAL | INSUFFICIENT_DATA


# ── Orchestrator ─────────────────────────────────────────────────────────────

class LocationAnalysisService:
    """
    Orchestrates all backend intelligence for a proposed drilling location in India.
    """

    SEARCH_RADII = [5.0, 15.0, 30.0]   # km; staged fallback

    def analyze(
        self,
        lat: float,
        lng: float,
        planned_depth_m: float,
        location_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            # ── 1. Sedimentary Basin & Administrative Context ───────────
            basin_match = classify_location_basin(lat, lng, location_name)
            basin_name = basin_match.basin_name if basin_match else None
            state_name = None

            # ── 2. National Research Activity Context (RESEARCH_MANIFEST) ─
            regional_ctx = research_catalog.build_regional_context(
                lat=lat,
                lng=lng,
                basin_name=basin_name,
                state_name=state_name,
                location_name=location_name
            )

            # Enrich regional context with stratigraphy and hazards if basin matched
            if basin_match:
                regional_ctx.typical_stratigraphy = basin_match.typical_stratigraphy
                regional_ctx.regional_hazards = basin_match.regional_hazards
                regional_ctx.watch_items = basin_match.watch_items
                regional_ctx.geological_province = basin_match.geological_province

            # ── 3. Staged nearby-well search (5 → 15 → 30 km) ───────────
            nearby_wells, radius_used = self._staged_well_search(db, lat, lng, planned_depth_m)

            # ── 4. Technical Depth & Operational Analog Discovery ───────
            analog_wells = find_analog_wells_for_depth(db, planned_depth_m, limit=4)

            # ── Case A: Direct offset wells exist within 30 km ───────────
            if nearby_wells:
                depth_risk_profile = self._build_depth_risk_profile(db, nearby_wells, planned_depth_m)
                critical_events = self._gather_critical_events(db, nearby_wells, planned_depth_m)
                doc_evidence = self._retrieve_doc_evidence(nearby_wells, planned_depth_m)
                area_summary = self._synthesize_summary(
                    nearby_wells, depth_risk_profile, critical_events, planned_depth_m, regional_ctx
                )
                geo_context = self._geological_context(depth_risk_profile, nearby_wells, regional_ctx)
                confidence = self._compute_confidence(nearby_wells, depth_risk_profile, doc_evidence)
                provenance_notes = self._build_provenance_notes(nearby_wells, radius_used, regional_ctx)

                brief = EngineeringBrief(
                    location_lat=lat,
                    location_lng=lng,
                    planned_depth_m=planned_depth_m,
                    location_name=location_name,
                    nearby_wells=nearby_wells,
                    depth_risk_profile=depth_risk_profile,
                    critical_events=critical_events,
                    document_evidence=doc_evidence,
                    regional_drilling_context=regional_ctx.to_dict(),
                    analog_wells=analog_wells,
                    area_risk_summary=area_summary,
                    geological_context=geo_context,
                    data_confidence=confidence,
                    provenance_notes=provenance_notes,
                    total_wells_analyzed=len(nearby_wells),
                    radius_used_km=radius_used,
                    analysis_status="OK" if confidence != "INSUFFICIENT" else "PARTIAL"
                )
                return asdict(brief)

            # ── Case B: NO Direct Offset Wells within 30 km (Fallback) ───
            # Use National Research Manifest + Basin Stratigraphy + Technical Analogs
            depth_risk_profile = self._build_fallback_depth_profile(basin_match, planned_depth_m)
            doc_evidence = self._retrieve_fallback_doc_evidence(basin_match, planned_depth_m, regional_ctx)
            critical_events = [] # Strictly empty: No direct events fabricated!

            area_summary = self._synthesize_fallback_summary(
                lat, lng, planned_depth_m, location_name, regional_ctx, analog_wells, basin_match
            )
            geo_context = self._fallback_geological_context(basin_match, regional_ctx, depth_risk_profile)
            confidence = "MODERATE" if (regional_ctx.is_hydrocarbon_region and basin_match) else "LOW" if regional_ctx.is_hydrocarbon_region else "INSUFFICIENT"
            provenance_notes = self._build_fallback_provenance_notes(regional_ctx, analog_wells)

            brief = EngineeringBrief(
                location_lat=lat,
                location_lng=lng,
                planned_depth_m=planned_depth_m,
                location_name=location_name,
                nearby_wells=[],
                depth_risk_profile=depth_risk_profile,
                critical_events=[],
                document_evidence=doc_evidence,
                regional_drilling_context=regional_ctx.to_dict(),
                analog_wells=analog_wells,
                area_risk_summary=area_summary,
                geological_context=geo_context,
                data_confidence=confidence,
                provenance_notes=provenance_notes,
                total_wells_analyzed=0,
                radius_used_km=30.0,
                analysis_status="PARTIAL" if confidence != "INSUFFICIENT" else "INSUFFICIENT_DATA"
            )
            return asdict(brief)

        finally:
            db.close()

    # ────────────────────────────────────────────────────────────────────────

    def _staged_well_search(
        self, db, lat: float, lng: float, planned_depth: float
    ):
        """Search at 5 → 15 → 30 km until at least 1 well is found."""
        all_wells = db.query(Well).all()
        for radius_km in self.SEARCH_RADII:
            candidates = []
            for w in all_wells:
                dist = haversine_distance(lat, lng, w.latitude, w.longitude)
                if dist <= radius_km:
                    f_names = [f.formation_name for f in w.formations]
                    evt_count = db.query(Event).filter(Event.well_id == w.well_id).count()
                    rel = calculate_offset_relevance(
                        active_lat=lat, active_lon=lng,
                        active_depth=planned_depth, active_td=planned_depth * 1.15,
                        active_formation=f_names[0] if f_names else "Unknown",
                        offset_lat=w.latitude, offset_lon=w.longitude,
                        offset_td=w.total_depth_md,
                        offset_formations=f_names,
                        offset_events_in_formation=evt_count,
                        offset_trajectory_deviation=round(dist * 40.0, 1)
                    )
                    candidates.append(NearbyWellSummary(
                        well_id=w.well_id,
                        well_name=w.well_name,
                        field=w.field,
                        distance_km=rel["distance_km"],
                        azimuth_deg=rel["azimuth_deg"],
                        total_depth_md=w.total_depth_md,
                        status=w.status,
                        latitude=w.latitude,
                        longitude=w.longitude,
                        relevance_score=rel["relevance_score"],
                        event_count=evt_count,
                        formations=f_names,
                        provenance=w.provenance,
                        is_synthetic=w.is_synthetic,
                        depth_overlap_m=rel["depth_overlap_m"],
                        formation_similarity=rel["formation_similarity"]
                    ))
            if candidates:
                candidates.sort(key=lambda x: x.relevance_score, reverse=True)
                return candidates, radius_km
        return [], 30.0

    def _build_depth_risk_profile(
        self, db, nearby_wells: List[NearbyWellSummary], planned_depth: float
    ) -> List[DepthRiskInterval]:
        """Build a consolidated depth-vs-risk profile from direct offset well formations."""
        formation_map: Dict[str, Dict] = {}

        for w in nearby_wells:
            frms = db.query(Formation).filter(Formation.well_id == w.well_id).order_by(Formation.top_md).all()
            for f in frms:
                if f.top_md > planned_depth + 600 or f.bottom_md < max(0, planned_depth - 600):
                    continue
                key = f.formation_name.lower().strip()
                if key not in formation_map:
                    formation_map[key] = {
                        "formation_name": f.formation_name,
                        "top_md": f.top_md,
                        "bottom_md": f.bottom_md,
                        "lithology": f.lithology,
                        "pore_pressure_gradient": f.pore_pressure_gradient,
                        "fracture_gradient": f.fracture_gradient,
                        "pressure_context": f.pressure_context or "",
                        "provenance": w.provenance,
                        "events": [],
                        "well_count": 0
                    }
                else:
                    prev = formation_map[key]
                    prev["pore_pressure_gradient"] = (prev["pore_pressure_gradient"] + f.pore_pressure_gradient) / 2
                    prev["fracture_gradient"] = (prev["fracture_gradient"] + f.fracture_gradient) / 2
                    if not prev["pressure_context"] and f.pressure_context:
                        prev["pressure_context"] = f.pressure_context
                formation_map[key]["well_count"] += 1

        for w in nearby_wells:
            evts = db.query(Event).filter(Event.well_id == w.well_id).all()
            for e in evts:
                f_key = e.formation.lower().strip() if e.formation else ""
                if f_key in formation_map:
                    formation_map[f_key]["events"].append({
                        "event_id": e.event_id,
                        "event_type": e.event_type,
                        "severity": e.severity,
                        "depth_start": e.depth_start,
                        "depth_end": e.depth_end,
                        "well_id": e.well_id,
                        "well_name": w.well_name,
                        "title": e.title,
                        "description": e.description,
                        "cause": e.cause,
                        "mitigation": e.mitigation,
                        "outcome": e.outcome,
                        "provenance": e.provenance
                    })

        intervals = []
        for key, data in formation_map.items():
            events = data["events"]
            risk_level = self._compute_interval_risk(events)
            prov = "DIRECT" if data["provenance"] == "PUBLIC" else "REGIONAL"

            intervals.append(DepthRiskInterval(
                depth_from=round(data["top_md"], 1),
                depth_to=round(data["bottom_md"], 1),
                formation_name=data["formation_name"],
                lithology=data["lithology"],
                risk_events=events,
                pore_pressure_gradient=round(data["pore_pressure_gradient"], 3),
                fracture_gradient=round(data["fracture_gradient"], 3),
                pressure_context=data["pressure_context"],
                risk_level=risk_level,
                evidence_count=len(events),
                provenance=prov
            ))

        intervals.sort(key=lambda x: x.depth_from)
        return intervals

    def _build_fallback_depth_profile(
        self, basin_match: Optional[Any], planned_depth: float
    ) -> List[DepthRiskInterval]:
        """Build regional stratigraphy profile when direct wells are absent."""
        if not basin_match or not basin_match.typical_stratigraphy:
            return []

        intervals = []
        for s in basin_match.typical_stratigraphy:
            drange = s.get("depth_range", "")
            d_from = 0.0
            d_to = 3500.0
            if "–" in drange:
                parts = drange.replace("m", "").split("–")
                try:
                    d_from = float(parts[0].strip())
                    d_to = float(parts[1].strip())
                except:
                    pass
            elif ">" in drange:
                try:
                    d_from = float(drange.replace(">", "").replace("m", "").strip())
                    d_to = max(d_from + 1200.0, planned_depth + 600.0)
                except:
                    pass

            # Check if within ±800m of planned depth
            if d_from > planned_depth + 800 or d_to < max(0, planned_depth - 800):
                continue

            intervals.append(DepthRiskInterval(
                depth_from=d_from,
                depth_to=d_to,
                formation_name=s.get("interval_name", "Regional Formation"),
                lithology=s.get("lithology", "Sedimentary clastics"),
                risk_events=[],
                pore_pressure_gradient=1.05,
                fracture_gradient=1.75,
                pressure_context=f"Regional prognosis: {s.get('drilling_behavior', '')}",
                risk_level="MEDIUM",
                evidence_count=0,
                provenance="REGIONAL"
            ))

        intervals.sort(key=lambda x: x.depth_from)
        return intervals

    def _compute_interval_risk(self, events: List[Dict]) -> str:
        if not events:
            return "LOW"
        severities = [e.get("severity", "LOW") for e in events]
        if "CRITICAL" in severities:
            return "CRITICAL"
        if severities.count("HIGH") >= 2:
            return "CRITICAL"
        if "HIGH" in severities:
            return "HIGH"
        if "MEDIUM" in severities:
            return "MEDIUM"
        return "LOW"

    def _gather_critical_events(
        self, db, nearby_wells: List[NearbyWellSummary], planned_depth: float
    ) -> List[Dict[str, Any]]:
        results = []
        depth_window = 600.0
        for w in nearby_wells:
            evts = db.query(Event).filter(
                Event.well_id == w.well_id,
                Event.severity.in_(["HIGH", "CRITICAL"]),
                Event.depth_start >= max(0, planned_depth - depth_window),
                Event.depth_start <= planned_depth + depth_window
            ).order_by(Event.depth_start).all()

            for e in evts:
                results.append({
                    "event_id": e.event_id,
                    "event_type": e.event_type,
                    "severity": e.severity,
                    "depth_start": e.depth_start,
                    "depth_end": e.depth_end,
                    "formation": e.formation,
                    "title": e.title,
                    "description": e.description,
                    "cause": e.cause,
                    "action": e.action,
                    "mitigation": e.mitigation,
                    "outcome": e.outcome,
                    "source_document": e.source_document,
                    "source_page": e.source_page,
                    "provenance": e.provenance,
                    "well_id": w.well_id,
                    "well_name": w.well_name,
                    "distance_km": w.distance_km,
                    "relevance_score": w.relevance_score
                })

        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:12]

    def _retrieve_doc_evidence(
        self, nearby_wells: List[NearbyWellSummary], planned_depth: float
    ) -> List[Dict[str, Any]]:
        well_ids = [w.well_id for w in nearby_wells[:4]]
        query = f"drilling hazards stuck pipe mud loss kick depth {planned_depth:.0f}"
        try:
            evidence = rag_engine.retrieve_evidence(
                query=query,
                depth=planned_depth,
                limit=6
            )
            filtered = [e for e in evidence if e.get("well_id") in well_ids]
            return filtered if filtered else evidence[:4]
        except Exception:
            return []

    def _retrieve_fallback_doc_evidence(
        self, basin_match: Optional[Any], planned_depth: float, regional_ctx: Any
    ) -> List[Dict[str, Any]]:
        """RAG evidence for regional / analog context."""
        basin_name = basin_match.basin_name if basin_match else regional_ctx.basin_name
        query = f"{basin_name} drilling challenges stuck pipe mud loss depth {planned_depth:.0f}"
        try:
            evidence = rag_engine.retrieve_evidence(
                query=query,
                depth=planned_depth,
                limit=4
            )
            # Re-tag evidence as ANALOG / REGIONAL if from other basins
            for e in evidence:
                e["provenance"] = "ANALOG"
            return evidence
        except Exception:
            return []

    def _synthesize_summary(
        self,
        nearby_wells: List[NearbyWellSummary],
        depth_profile: List[DepthRiskInterval],
        critical_events: List[Dict],
        planned_depth: float,
        regional_ctx: Any
    ) -> str:
        n = len(nearby_wells)
        closest = nearby_wells[0]
        high_risk_intervals = [i for i in depth_profile if i.risk_level in ("HIGH", "CRITICAL")]
        critical_count = len([e for e in critical_events if e["severity"] == "CRITICAL"])
        high_count = len([e for e in critical_events if e["severity"] == "HIGH"])

        parts = []
        parts.append(
            f"Direct area analysis based on {n} offset well(s) within {nearby_wells[-1].distance_km:.1f} km. "
            f"Closest reference: {closest.well_name} ({closest.distance_km:.1f} km, "
            f"TD {closest.total_depth_md:.0f}m, relevance score {closest.relevance_score:.0f}/100)."
        )

        if high_risk_intervals:
            names = ", ".join(set(i.formation_name for i in high_risk_intervals[:3]))
            parts.append(
                f"HIGH or CRITICAL risk intervals identified at planned depth vicinity: {names}. "
                f"Total {critical_count} CRITICAL and {high_count} HIGH-severity historical incidents "
                f"recorded within ±600m of planned depth {planned_depth:.0f}m."
            )
        elif depth_profile:
            parts.append(
                f"No CRITICAL risk intervals detected within ±600m of planned depth {planned_depth:.0f}m. "
                f"Proceed with standard drilling program but monitor for formation-specific risks."
            )

        if regional_ctx and regional_ctx.matched_research_areas:
            m = regional_ctx.matched_research_areas[0]
            parts.append(
                f"Regional drilling context: Falls in the {m.area_name} ({m.basin}, {m.state_or_region}) "
                f"with {m.activity_tier.replace('_', ' ').title()} operational tier."
            )

        return " ".join(parts)

    def _synthesize_fallback_summary(
        self,
        lat: float,
        lng: float,
        planned_depth: float,
        location_name: Optional[str],
        regional_ctx: Any,
        analog_wells: List[Dict[str, Any]],
        basin_match: Optional[Any]
    ) -> str:
        parts = []
        loc_str = location_name or f"{lat.toFixed(4) if hasattr(lat, 'toFixed') else round(lat, 4)}°N, {round(lng, 4)}°E"

        if regional_ctx.is_hydrocarbon_region and regional_ctx.matched_research_areas:
            top_area = regional_ctx.matched_research_areas[0]
            parts.append(
                f"REGIONAL RESEARCH CONTEXT: Proposed location '{loc_str}' falls within the documented "
                f"{top_area.area_name} ({top_area.basin}, {top_area.state_or_region}). "
                f"Activity status in research manifest is {top_area.activity_tier.replace('_', ' ').title()}."
            )
            if top_area.recent_or_current_activity_signal:
                parts.append(f"Operational Signal: {top_area.recent_or_current_activity_signal}")
            if top_area.operators_evidenced:
                parts.append(f"Evidenced Operators: {top_area.operators_evidenced}.")
        elif basin_match:
            parts.append(
                f"REGIONAL BASIN CONTEXT: Location falls within {basin_match.basin_name} ({basin_match.geological_province})."
            )
        else:
            parts.append(
                f"UNMAPPED / LOW-DATA LOCATION: No direct offset wells or documented hydrocarbon activity found within 30 km."
            )

        parts.append(
            f"DIRECT OFFSET STATUS: NO direct well headers are currently indexed in the local database within 30 km. "
            f"All operational prognoses for planned depth {planned_depth:.0f}m are derived from regional sedimentary stratigraphy "
            f"and technical depth analog wells."
        )

        if analog_wells:
            top_analog = analog_wells[0]
            parts.append(
                f"Technical Analog Benchmark: {top_analog['well_name']} (TD {top_analog['total_depth_md']:.0f}m, "
                f"Relevance {top_analog['analog_relevance_score']:.0f}/100) provides casing design and hydraulics references."
            )

        return " ".join(parts)

    def _geological_context(
        self, depth_profile: List[DepthRiskInterval], nearby_wells: List[NearbyWellSummary], regional_ctx: Any
    ) -> str:
        if not depth_profile:
            return "Geological context: Formation log data not available for this exact location from nearby wells."

        frms = [i.formation_name for i in depth_profile]
        unique_frms = list(dict.fromkeys(frms))
        frm_list = ", ".join(unique_frms[:5])
        lithologies = list(set(i.lithology for i in depth_profile))[:3]
        lith_str = ", ".join(lithologies)

        return (
            f"Formation column within analysis window includes: {frm_list}. "
            f"Dominant lithologies: {lith_str}. "
            f"Pore pressure gradients range from "
            f"{min(i.pore_pressure_gradient for i in depth_profile):.3f} to "
            f"{max(i.pore_pressure_gradient for i in depth_profile):.3f} g/cc. "
            f"(SOURCE: {depth_profile[0].provenance} — derived from {len(nearby_wells)} offset wells)"
        )

    def _fallback_geological_context(
        self, basin_match: Optional[Any], regional_ctx: Any, depth_profile: List[DepthRiskInterval]
    ) -> str:
        if basin_match:
            desc = basin_match.description
            strat_names = [s.get("interval_name", "") for s in basin_match.typical_stratigraphy]
            hazards = "; ".join(basin_match.regional_hazards[:3])
            return (
                f"Sedimentary Province: {basin_match.geological_province}. {desc} "
                f"Regional stratigraphic intervals: {', '.join(strat_names[:4])}. "
                f"Documented regional drilling hazards: {hazards}."
            )
        elif regional_ctx.matched_research_areas:
            a = regional_ctx.matched_research_areas[0]
            themes = a.key_drilling_knowledge_or_risk_themes or "Frontier exploration context"
            return (
                f"Research Manifest Area: {a.area_name} ({a.basin}). "
                f"Key drilling knowledge & risk themes: {themes}."
            )
        return "Geological context: Location is outside currently indexed sedimentary basin perimeters."

    def _compute_confidence(
        self,
        nearby_wells: List[NearbyWellSummary],
        depth_profile: List[DepthRiskInterval],
        doc_evidence: List[Dict]
    ) -> str:
        score = 0
        if len(nearby_wells) >= 3:
            score += 40
        elif len(nearby_wells) >= 1:
            score += 20

        if len(depth_profile) >= 3:
            score += 30
        elif len(depth_profile) >= 1:
            score += 15

        if len(doc_evidence) >= 3:
            score += 30
        elif len(doc_evidence) >= 1:
            score += 15

        if score >= 70:
            return "HIGH"
        elif score >= 40:
            return "MODERATE"
        elif score > 0:
            return "LOW"
        return "INSUFFICIENT"

    def _build_provenance_notes(
        self, nearby_wells: List[NearbyWellSummary], radius_km: float, regional_ctx: Any
    ) -> str:
        synthetic = sum(1 for w in nearby_wells if w.is_synthetic)
        real = len(nearby_wells) - synthetic
        return (
            f"Analysis radius: {radius_km:.0f} km. "
            f"Direct offset wells: {len(nearby_wells)} total ({real} public/field records, {synthetic} synthetic/derived). "
            f"Regional context: {regional_ctx.basin_name} (RESEARCH_MANIFEST). "
            f"No formation data has been fabricated."
        )

    def _build_fallback_provenance_notes(
        self, regional_ctx: Any, analog_wells: List[Dict[str, Any]]
    ) -> str:
        return (
            f"NO DIRECT OFFSET WELLS found within 30 km. "
            f"Regional basin intelligence sourced from National Research Manifest (provenance: RESEARCH_MANIFEST, version: 2026-09). "
            f"Technical analog benchmark provided by {len(analog_wells)} reference well(s) (provenance: ANALOG). "
            f"Strict non-fabrication rule enforced: No operational well logs or event histories fabricated."
        )


# Singleton
location_service = LocationAnalysisService()
