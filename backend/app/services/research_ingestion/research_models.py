"""
Research Models & Data Transfer Entities
========================================
Pydantic and dataclass models for the eRTMAC-NWIS India-wide Research Manifest
coverage, validation, cataloging, and gap analysis.
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
from datetime import datetime


@dataclass
class NationalActivityArea:
    """
    Standardized in-memory and serialization model for an area-level research manifest entity.
    Never fabricated into fake well logs or operational parameters.
    """
    area_id: str
    area_name: str
    normalized_name: str
    state_or_region: str
    basin: str
    environment: str
    activity_tier: str
    operators_evidenced: Optional[str] = None
    historical_wells_basin_total: Optional[int] = None
    recent_or_current_activity_signal: Optional[str] = None
    key_drilling_knowledge_or_risk_themes: Optional[str] = None
    activity_evidence_period: Optional[str] = None
    map_search_anchor: Optional[str] = None
    anchor_latitude: Optional[float] = None
    anchor_longitude: Optional[float] = None
    nwis_data_priority: str = "HIGH"
    provenance_classes_to_store: str = "DIRECT;REGIONAL;ANALOG"
    separate_training_cohort: str = "NO"
    recommended_ingestion_notes: Optional[str] = None
    source_urls: Optional[str] = None
    source_file: str = "nwis_india_hydrocarbon_drilling_activity_master.csv"
    provenance: str = "RESEARCH_MANIFEST"
    research_version: str = "2026-09"
    research_snapshot_date: str = "2026-09"
    ingested_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class IngestionReport:
    """
    Detailed audit and change report produced during research file loading and indexing.
    """
    status: str
    canonical_format: str
    source_files_evaluated: List[str]
    total_records: int
    added: int
    updated: int
    unchanged: int
    conflicting: int
    invalid: int
    snapshot_version: str
    discrepancies: List[Dict[str, Any]] = field(default_factory=list)
    validation_warnings: List[str] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class RegionalDrillingContext:
    """
    Contextual intelligence attached to an Engineering Brief.
    Provides verified basin/area context without fabricating offset well data.
    """
    is_hydrocarbon_region: bool
    basin_name: str
    geological_province: Optional[str]
    state_or_region: Optional[str]
    matched_research_areas: List[NationalActivityArea]
    historical_activity: str
    recent_activity_signal: str
    relevant_operators: List[str]
    key_drilling_themes: List[str]
    regional_hazards: List[str]
    watch_items: List[str]
    typical_stratigraphy: List[Dict[str, Any]]
    data_gap_status: str          # COMPLETE | PARTIAL | RESEARCH_ONLY | MISSING
    data_acquisition_priority: str # VERY_HIGH | HIGH | MEDIUM | LOW
    provenance: str = "RESEARCH_MANIFEST"
    source_references: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_hydrocarbon_region": self.is_hydrocarbon_region,
            "basin_name": self.basin_name,
            "geological_province": self.geological_province,
            "state_or_region": self.state_or_region,
            "matched_research_areas": [a.to_dict() for a in self.matched_research_areas],
            "historical_activity": self.historical_activity,
            "recent_activity_signal": self.recent_activity_signal,
            "relevant_operators": self.relevant_operators,
            "key_drilling_themes": self.key_drilling_themes,
            "regional_hazards": self.regional_hazards,
            "watch_items": self.watch_items,
            "typical_stratigraphy": self.typical_stratigraphy,
            "data_gap_status": self.data_gap_status,
            "data_acquisition_priority": self.data_acquisition_priority,
            "provenance": self.provenance,
            "source_references": self.source_references
        }


@dataclass
class NationalCoverageSummary:
    """
    Dashboard summary of nationwide research manifest coverage, gap analysis, and acquisition roadmap.
    """
    total_areas: int
    total_states: int
    total_basins: int
    priority_breakdown: Dict[str, int]
    activity_tier_breakdown: Dict[str, int]
    environment_breakdown: Dict[str, int]
    state_coverage: List[Dict[str, Any]]
    basin_coverage: List[Dict[str, Any]]
    data_acquisition_roadmap: List[Dict[str, Any]]
    canonical_source_file: str
    snapshot_version: str
    last_refreshed: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
