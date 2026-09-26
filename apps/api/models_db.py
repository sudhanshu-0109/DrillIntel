import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from apps.api.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="DRILLING_ENGINEER", nullable=False) # DRILLING_ENGINEER, DRILLING_SUPERVISOR, GEOLOGIST, MUD_ENGINEER, OPERATIONS, ANALYST, ML_ENGINEER, ADMIN
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False) # e.g. "ACKNOWLEDGE_ALERT", "INGEST_DOCUMENT", "SIMULATOR_START"
    entity_type = Column(String(50), nullable=False) # "alert", "well", "document"
    entity_id = Column(String(100), nullable=False)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Well(Base):
    __tablename__ = "wells"
    
    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String(100), unique=True, index=True, nullable=False)
    well_name = Column(String(255), nullable=False)
    field = Column(String(100), nullable=False, index=True) # e.g. Duliajan, Moran
    block = Column(String(100), nullable=False)
    basin = Column(String(100), default="Assam-Arakan")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    surface_latitude = Column(Float, nullable=False)
    surface_longitude = Column(Float, nullable=False)
    bottom_hole_latitude = Column(Float, nullable=True)
    bottom_hole_longitude = Column(Float, nullable=True)
    elevation_kb = Column(Float, default=112.5) # meters
    spud_date = Column(String(50), nullable=True)
    total_depth_md = Column(Float, nullable=False) # meters
    total_depth_tvd = Column(Float, nullable=True) # meters
    status = Column(String(50), default="DRILLING") # DRILLING, COMPLETED, SUSPENDED, ABANDONED
    data_source = Column(String(100), default="SYNTHETIC_PROXY")
    provenance = Column(String(50), default="SYNTHETIC") # PUBLIC, AUTHORIZED, SYNTHETIC, DERIVED
    is_synthetic = Column(Boolean, default=True)
    
    # Active drilling context
    current_depth = Column(Float, default=0.0)
    current_formation = Column(String(100), default="Unknown")
    last_update = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    formations = relationship("Formation", back_populates="well", cascade="all, delete-orphan")
    trajectories = relationship("Trajectory", back_populates="well", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="well", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="well", cascade="all, delete-orphan")

class Formation(Base):
    __tablename__ = "formations"
    
    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String(100), ForeignKey("wells.well_id"), nullable=False, index=True)
    formation_name = Column(String(100), nullable=False, index=True)
    top_md = Column(Float, nullable=False)
    bottom_md = Column(Float, nullable=False)
    top_tvd = Column(Float, nullable=True)
    bottom_tvd = Column(Float, nullable=True)
    lithology = Column(String(100), default="Sandstone") # Sandstone, Claystone, Shale, Siltstone
    pore_pressure_gradient = Column(Float, default=1.05) # SG equivalent
    fracture_gradient = Column(Float, default=1.75) # SG equivalent
    pressure_context = Column(Text, nullable=True)
    source = Column(String(100), default="WCR / Composite Log")
    provenance = Column(String(50), default="SYNTHETIC")
    
    well = relationship("Well", back_populates="formations")

class Trajectory(Base):
    __tablename__ = "trajectories"
    
    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String(100), ForeignKey("wells.well_id"), nullable=False, index=True)
    md = Column(Float, nullable=False)
    tvd = Column(Float, nullable=False)
    tvdss = Column(Float, nullable=True)
    inclination = Column(Float, default=0.0) # degrees
    azimuth = Column(Float, default=0.0) # degrees
    dogleg_severity = Column(Float, default=0.0) # deg/30m
    northing = Column(Float, default=0.0)
    easting = Column(Float, default=0.0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    well = relationship("Well", back_populates="trajectories")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), unique=True, index=True, nullable=False)
    well_id = Column(String(100), ForeignKey("wells.well_id"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True) # stuck_pipe, mud_loss, lost_circulation, kick, well_control, pack_off, washout
    severity = Column(String(50), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    start_time = Column(String(50), nullable=True)
    end_time = Column(String(50), nullable=True)
    depth_start = Column(Float, nullable=False)
    depth_end = Column(Float, nullable=False)
    formation = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    cause = Column(Text, nullable=True)
    action = Column(Text, nullable=True)
    mitigation = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)
    source_document = Column(String(100), nullable=True)
    source_page = Column(Integer, default=1)
    provenance = Column(String(50), default="SYNTHETIC")
    is_synthetic = Column(Boolean, default=True)
    
    well = relationship("Well", back_populates="events")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(100), unique=True, index=True, nullable=False)
    well_id = Column(String(100), ForeignKey("wells.well_id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    document_type = Column(String(100), nullable=False) # DDR, WCR, MUD_LOG, DIRECTIONAL_SURVEY, NPT_REPORT
    date = Column(String(50), nullable=True)
    page_count = Column(Integer, default=1)
    file_path = Column(String(500), nullable=True)
    source = Column(String(100), default="OIL/NDR Proxy")
    provenance = Column(String(50), default="SYNTHETIC")
    extraction_confidence = Column(Float, default=0.95)
    status = Column(String(50), default="COMPLETED") # UPLOADED, PROCESSING, COMPLETED, FAILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    well = relationship("Well", back_populates="documents")
    pages = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentPage(Base):
    __tablename__ = "document_pages"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(100), ForeignKey("documents.document_id"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    text_content = Column(Text, nullable=False)
    tables_json = Column(JSON, nullable=True)
    depth_start = Column(Float, nullable=True)
    depth_end = Column(Float, nullable=True)
    formation = Column(String(100), nullable=True)
    has_event = Column(Boolean, default=False)
    
    document = relationship("Document", back_populates="pages")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(String(100), unique=True, index=True, nullable=False)
    document_id = Column(String(100), ForeignKey("documents.document_id"), nullable=False, index=True)
    well_id = Column(String(100), nullable=False, index=True)
    page_number = Column(Integer, default=1)
    chunk_text = Column(Text, nullable=False)
    depth_start = Column(Float, nullable=True)
    depth_end = Column(Float, nullable=True)
    formation = Column(String(100), nullable=True)
    event_type = Column(String(100), nullable=True)
    provenance = Column(String(50), default="SYNTHETIC")
    extraction_confidence = Column(Float, default=0.92)
    embedding = Column(JSON, nullable=True) # Serialized float vector
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    document = relationship("Document", back_populates="chunks")

class RealTimeMeasurement(Base):
    __tablename__ = "real_time_measurements"
    
    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String(100), index=True, nullable=False)
    timestamp = Column(String(50), nullable=False)
    measured_depth = Column(Float, nullable=False)
    rop = Column(Float, nullable=False) # Rate of penetration (m/hr)
    wob = Column(Float, nullable=False) # Weight on bit (kN)
    rpm = Column(Float, nullable=False) # Rotary speed (rpm)
    torque = Column(Float, nullable=False) # Surface torque (kNm)
    hookload = Column(Float, nullable=False) # Hook load (kN)
    standpipe_pressure = Column(Float, nullable=False) # Standpipe pressure (bar)
    flow_in = Column(Float, nullable=False) # Flow rate in (L/min)
    flow_out = Column(Float, nullable=False) # Flow rate out (L/min)
    mud_weight = Column(Float, nullable=False) # Specific gravity
    ecd = Column(Float, nullable=False) # Equivalent circulating density
    formation = Column(String(100), nullable=False)

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(100), unique=True, index=True, nullable=False)
    well_id = Column(String(100), index=True, nullable=False)
    event_type = Column(String(100), nullable=False) # stuck_pipe, mud_loss, kick
    probability = Column(Float, nullable=False)
    risk_class = Column(String(50), nullable=False) # LOW, MEDIUM, HIGH
    prediction_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    model_version = Column(String(100), nullable=False)
    depth = Column(Float, nullable=False)
    formation = Column(String(100), nullable=False)
    feature_window_start = Column(String(50), nullable=True)
    feature_window_end = Column(String(50), nullable=True)
    top_features = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=True)
    shap_values = Column(JSON, nullable=True)
    data_quality = Column(String(50), default="NOMINAL")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(100), unique=True, index=True, nullable=False)
    well_id = Column(String(100), index=True, nullable=False)
    event_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False) # LOW, MEDIUM, HIGH
    depth = Column(Float, nullable=False)
    formation = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    probability = Column(Float, nullable=False)
    model_version = Column(String(100), nullable=False)
    reason = Column(Text, nullable=False)
    top_features = Column(JSON, nullable=True)
    historical_evidence = Column(JSON, nullable=True)
    source_documents = Column(JSON, nullable=True)
    status = Column(String(50), default="OPEN") # OPEN, ACKNOWLEDGED, ASSIGNED, RESOLVED
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ModelMetadata(Base):
    __tablename__ = "model_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String(100), unique=True, index=True, nullable=False)
    model_name = Column(String(255), nullable=False)
    event_type = Column(String(100), nullable=False)
    version = Column(String(100), nullable=False)
    algorithm = Column(String(100), default="XGBoost")
    training_dataset = Column(String(255), nullable=False)
    precision = Column(Float, default=0.88)
    recall = Column(Float, default=0.85)
    pr_auc = Column(Float, default=0.89)
    roc_auc = Column(Float, default=0.92)
    lead_time_min = Column(Float, default=18.5)
    false_alert_rate = Column(Float, default=0.04)
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DataSource(Base):
    __tablename__ = "data_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    source_type = Column(String(100), nullable=False) # OIL_INTERNAL, NDR_DGH, EQUINOR_VOLVE, UTAH_FORGE, SYNTHETIC
    provenance = Column(String(50), nullable=False) # PUBLIC, AUTHORIZED, SYNTHETIC, DERIVED
    record_count = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="ACTIVE")
    description = Column(Text, nullable=True)
