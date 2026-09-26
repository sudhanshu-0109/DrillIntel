from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

# --- Well Schemas ---
class TrajectoryPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    md: float
    tvd: float
    tvdss: Optional[float] = None
    inclination: float
    azimuth: float
    dogleg_severity: float
    northing: float
    easting: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class FormationInterval(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    formation_name: str
    top_md: float
    bottom_md: float
    top_tvd: Optional[float] = None
    bottom_tvd: Optional[float] = None
    lithology: str
    pore_pressure_gradient: float
    fracture_gradient: float
    pressure_context: Optional[str] = None
    provenance: str

class WellBase(BaseModel):
    well_id: str
    well_name: str
    field: str
    block: str
    basin: str
    latitude: float
    longitude: float
    surface_latitude: float
    surface_longitude: float
    bottom_hole_latitude: Optional[float] = None
    bottom_hole_longitude: Optional[float] = None
    elevation_kb: float
    spud_date: Optional[str] = None
    total_depth_md: float
    total_depth_tvd: Optional[float] = None
    status: str
    data_source: str
    provenance: str
    is_synthetic: bool
    current_depth: float
    current_formation: str

class WellDetail(WellBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    last_update: datetime
    formations: List[FormationInterval] = []

class OffsetWellRelevance(BaseModel):
    well_id: str
    well_name: str
    field: str
    distance_km: float
    azimuth_deg: float
    depth_overlap_m: float
    formation_similarity: float
    trajectory_proximity_m: float
    historical_event_count: int
    relevance_score: float
    provenance: str
    is_synthetic: bool
    latitude: float
    longitude: float
    total_depth_md: float
    status: str

# --- Event Schemas ---
class EventItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str
    well_id: str
    event_type: str
    severity: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    depth_start: float
    depth_end: float
    formation: str
    title: str
    description: str
    cause: Optional[str] = None
    action: Optional[str] = None
    mitigation: Optional[str] = None
    outcome: Optional[str] = None
    source_document: Optional[str] = None
    source_page: int = 1
    provenance: str
    is_synthetic: bool

# --- Document Schemas ---
class DocumentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: str
    well_id: str
    title: str
    document_type: str
    date: Optional[str] = None
    page_count: int
    source: str
    provenance: str
    extraction_confidence: float
    status: str
    created_at: datetime

class DocumentPageItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    page_number: int
    text_content: str
    tables_json: Optional[Any] = None
    depth_start: Optional[float] = None
    depth_end: Optional[float] = None
    formation: Optional[str] = None
    has_event: bool

class DocumentIngestRequest(BaseModel):
    well_id: str
    title: str
    document_type: str
    date: Optional[str] = None
    depth_start: Optional[float] = None
    depth_end: Optional[float] = None
    formation: Optional[str] = None
    event_type: Optional[str] = None
    provenance: str = "SYNTHETIC"
    raw_text: str

# --- Real-Time Schemas ---
class RealTimeDataPoint(BaseModel):
    well_id: str
    timestamp: str
    measured_depth: float
    rop: float
    wob: float
    rpm: float
    torque: float
    hookload: float
    standpipe_pressure: float
    flow_in: float
    flow_out: float
    mud_weight: float
    ecd: float
    formation: str

# --- ML & SHAP Schemas ---
class SHAPContributor(BaseModel):
    feature_name: str
    display_name: str
    feature_value: float
    shap_value: float
    impact: str

class RiskPredictionResponse(BaseModel):
    prediction_id: str
    well_id: str
    event_type: str
    probability: float
    risk_class: str
    prediction_timestamp: datetime
    model_version: str
    depth: float
    formation: str
    top_features: List[Dict[str, Any]]
    explanation: str
    shap_contributors: List[SHAPContributor]
    data_quality: str

# --- Alert Schemas ---
class AlertItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    alert_id: str
    well_id: str
    event_type: str
    severity: str
    depth: float
    formation: str
    timestamp: datetime
    probability: float
    model_version: str
    reason: str
    top_features: Optional[List[Dict[str, Any]]] = None
    historical_evidence: Optional[List[Dict[str, Any]]] = None
    source_documents: Optional[List[Dict[str, Any]]] = None
    status: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

class AlertAcknowledgeRequest(BaseModel):
    notes: Optional[str] = "Acknowledged by rig engineering team."

# --- AI & RAG Schemas ---
class AIQueryRequest(BaseModel):
    query: str
    well_id: Optional[str] = None
    current_depth: Optional[float] = None
    current_formation: Optional[str] = None
    radius_km: Optional[float] = 10.0

class RAGEvidenceItem(BaseModel):
    well_id: str
    document_id: str
    document_title: str
    page_number: int
    depth_start: Optional[float] = None
    depth_end: Optional[float] = None
    formation: Optional[str] = None
    event_type: Optional[str] = None
    snippet: str
    confidence: float
    provenance: str

class AIQueryResponse(BaseModel):
    query: str
    active_well_id: Optional[str] = None
    depth_context: Optional[float] = None
    formation_context: Optional[str] = None
    interpretation: str
    retrieved_evidence: List[RAGEvidenceItem]
    confidence_level: str
    evidence_status: str
    model_used: str

# --- Admin Schemas ---
class ModelMetadataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    model_id: str
    model_name: str
    event_type: str
    version: str
    algorithm: str
    training_dataset: str
    precision: float
    recall: float
    pr_auc: float
    roc_auc: float
    lead_time_min: float
    false_alert_rate: float
    status: str
    created_at: datetime

class DataSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    source_type: str
    provenance: str
    record_count: int
    last_updated: datetime
    status: str
    description: Optional[str] = None
