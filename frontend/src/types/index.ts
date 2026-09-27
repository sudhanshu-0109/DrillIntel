export type ProvenanceType = 'PUBLIC' | 'AUTHORIZED' | 'SYNTHETIC' | 'DERIVED' | 'RESEARCH_MANIFEST';

export interface FormationInterval {
  id: number;
  formation_name: string;
  top_md: number;
  bottom_md: number;
  top_tvd?: number;
  bottom_tvd?: number;
  lithology: string;
  pore_pressure_gradient: number;
  fracture_gradient: number;
  pressure_context?: string;
  provenance: string;
}

export interface TrajectoryPoint {
  md: number;
  tvd: number;
  tvdss?: number;
  inclination: number;
  azimuth: number;
  dogleg_severity: number;
  northing: number;
  easting: number;
  latitude?: number;
  longitude?: number;
}

export interface Well {
  well_id: string;
  well_name: string;
  field: string;
  block: string;
  basin: string;
  latitude: number;
  longitude: number;
  surface_latitude: number;
  surface_longitude: number;
  bottom_hole_latitude?: number;
  bottom_hole_longitude?: number;
  elevation_kb: number;
  spud_date?: string;
  total_depth_md: number;
  total_depth_tvd?: number;
  status: 'DRILLING' | 'COMPLETED' | 'PRODUCING' | 'SUSPENDED' | 'ABANDONED';
  data_source: string;
  provenance: ProvenanceType;
  is_synthetic: boolean;
  current_depth: number;
  current_formation: string;
  formations?: FormationInterval[];
}

export interface OffsetWellRelevance {
  well_id: string;
  well_name: string;
  field: string;
  distance_km: number;
  azimuth_deg: number;
  depth_overlap_m: number;
  formation_similarity: number;
  trajectory_proximity_m: number;
  historical_event_count: number;
  relevance_score: number;
  provenance: ProvenanceType;
  is_synthetic: boolean;
  latitude: number;
  longitude: number;
  total_depth_md: number;
  status: string;
}

export interface EventItem {
  event_id: string;
  well_id: string;
  event_type: 'stuck_pipe' | 'mud_loss' | 'lost_circulation' | 'kick' | 'well_control' | 'pack_off' | 'washout' | string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  start_time?: string;
  end_time?: string;
  depth_start: number;
  depth_end: number;
  formation: string;
  title: string;
  description: string;
  cause?: string;
  action?: string;
  mitigation?: string;
  outcome?: string;
  source_document?: string;
  source_page: number;
  provenance: ProvenanceType;
  is_synthetic: boolean;
}

export interface DocumentItem {
  document_id: string;
  well_id: string;
  title: string;
  document_type: string;
  date?: string;
  page_count: number;
  source: string;
  provenance: ProvenanceType;
  extraction_confidence: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export interface DocumentPageItem {
  page_number: number;
  text_content: string;
  tables_json?: any;
  depth_start?: number;
  depth_end?: number;
  formation?: string;
  has_event: boolean;
}

export interface RealTimeDataPoint {
  well_id: string;
  timestamp: string;
  measured_depth: number;
  rop: number;
  wob: number;
  rpm: number;
  torque: number;
  hookload: number;
  standpipe_pressure: number;
  flow_in: number;
  flow_out: number;
  mud_weight: number;
  ecd: number;
  formation: string;
}

export interface SHAPContributor {
  feature_name: string;
  display_name: string;
  feature_value: number;
  shap_value: number;
  impact: 'INCREASES_RISK' | 'DECREASES_RISK' | 'NEUTRAL';
}

export interface RiskPrediction {
  prediction_id: string;
  well_id: string;
  event_type: string;
  probability: number;
  risk_class: 'LOW' | 'MEDIUM' | 'HIGH';
  prediction_timestamp: string;
  model_version: string;
  depth: number;
  formation: string;
  top_features?: any[];
  explanation?: string;
  shap_contributors?: SHAPContributor[];
  data_quality?: string;
}

export interface Alert {
  alert_id: string;
  well_id: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  depth: number;
  formation: string;
  timestamp: string;
  probability: number;
  model_version: string;
  reason: string;
  top_features?: any[];
  historical_evidence?: any[];
  source_documents?: any[];
  status: 'OPEN' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'RESOLVED';
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolution_notes?: string;
}

export type AlertItem = Alert;

export interface RAGEvidenceItem {
  score?: number;
  source_type?: string;
  well_id: string;
  document_id: string;
  document_title: string;
  page_number: number;
  depth_start?: number;
  depth_end?: number;
  formation?: string;
  event_type?: string;
  snippet: string;
  confidence: number;
  provenance: string;
  area_id?: string;
  area_name?: string;
  state?: string;
  basin?: string;
  activity_tier?: string;
}

export interface RAGAnswer {
  query: string;
  interpretation: string;
  retrieved_evidence: RAGEvidenceItem[];
  confidence_level: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_EVIDENCE';
  evidence_status: 'STRONG_EVIDENCE' | 'PARTIAL_EVIDENCE' | 'INSUFFICIENT_EVIDENCE';
  model_used: string;
  active_well_id?: string;
  depth_context?: number;
  formation_context?: string;
}

export type AIQueryResponse = RAGAnswer;

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface ModelMetadata {
  model_id: string;
  model_name: string;
  event_type: string;
  version: string;
  algorithm: string;
  training_dataset: string;
  precision: number;
  recall: number;
  pr_auc: number;
  roc_auc: number;
  lead_time_min: number;
  false_alert_rate: number;
  status: string;
  created_at: string;
}

export interface DataSource {
  id: number;
  name: string;
  source_type: string;
  provenance: ProvenanceType;
  record_count: number;
  last_updated: string;
  status: string;
  description?: string;
}

// ── Research Manifest & National Intelligence Types ───────────────────────

export interface ResearchArea {
  id?: number | string;
  area_id: string;
  area_name: string;
  name?: string;
  normalized_name: string;
  state_or_region: string;
  state?: string;
  district?: string;
  basin: string;
  geological_province?: string;
  environment: string;
  activity_tier: string;
  operators_evidenced?: string;
  operator_signals?: string;
  historical_wells_basin_total?: number;
  recent_or_current_activity_signal?: string;
  key_drilling_knowledge_or_risk_themes?: string;
  activity_evidence_period?: string;
  map_search_anchor?: string;
  anchor_latitude?: number;
  anchor_longitude?: number;
  nwis_data_priority: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  nwis_well_coverage?: string;
  missing_data_types?: string[];
  provenance_classes_to_store?: string;
  separate_training_cohort?: string;
  recommended_ingestion_notes?: string;
  source_urls?: string;
  source_file: string;
  provenance: string;
  research_version: string;
  research_snapshot_date: string;
  ingested_at?: string;
}

export interface RegionalDrillingContext {
  is_hydrocarbon_region: boolean;
  basin_name: string;
  geological_province?: string;
  state_or_region?: string;
  matched_research_areas: ResearchArea[];
  historical_activity: string;
  recent_activity_signal: string;
  relevant_operators: string[];
  key_drilling_themes: string[];
  regional_hazards: string[];
  watch_items: string[];
  typical_stratigraphy: {
    interval_name: string;
    depth_range: string;
    lithology: string;
    drilling_behavior: string;
  }[];
  data_gap_status: 'COMPLETE' | 'PARTIAL' | 'RESEARCH_ONLY' | 'MISSING' | string;
  data_acquisition_priority: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  provenance: string;
  source_references: string[];
}

export interface DataAcquisitionRoadmapItem {
  area_id: string;
  area_name: string;
  state: string;
  basin: string;
  environment: string;
  activity_tier: string;
  research_manifest_status: string;
  direct_wells_in_nwis: string;
  document_coverage: string;
  historical_events: string;
  time_series: string;
  data_acquisition_priority: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  acquisition_target: string;
  recommended_notes: string;
}

export interface NationalCoverageSummary {
  total_areas: number;
  total_states: number;
  total_basins: number;
  priority_breakdown: Record<string, number>;
  activity_tier_breakdown: Record<string, number>;
  environment_breakdown: Record<string, number>;
  state_coverage: {
    state_or_region: string;
    area_count: number;
    basins: string[];
    priority: string;
  }[];
  basin_coverage: {
    basin: string;
    area_count: number;
    direct_wells_in_db: number;
    coverage_status: string;
    priority: string;
    environment: string;
    operators: string[];
  }[];
  data_acquisition_roadmap: DataAcquisitionRoadmapItem[];
  canonical_source_file: string;
  snapshot_version: string;
  last_refreshed?: string;
}

export interface ResearchRefreshReport {
  status: string;
  canonical_format: string;
  source_files_evaluated: string[];
  total_records: number;
  added: number;
  updated: number;
  unchanged: number;
  conflicting: number;
  invalid: number;
  snapshot_version: string;
  discrepancies: any[];
  validation_warnings: string[];
  timestamp: string;
}

// ── Location Analysis / Plan Well Types ─────────────────────────────────

export interface GeocodeResult {
  display_name: string;
  lat: number;
  lng: number;
  place_type: string;
}

export interface NearbyWellSummary {
  well_id: string;
  well_name: string;
  field: string;
  distance_km: number;
  azimuth_deg: number;
  total_depth_md: number;
  status: string;
  latitude: number;
  longitude: number;
  relevance_score: number;
  event_count: number;
  formations: string[];
  provenance: string;
  is_synthetic: boolean;
  depth_overlap_m: number;
  formation_similarity: number;
}

export interface DepthRiskInterval {
  depth_from: number;
  depth_to: number;
  formation_name: string;
  lithology: string;
  risk_events: any[];
  pore_pressure_gradient: number;
  fracture_gradient: number;
  pressure_context: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence_count: number;
  provenance: string;
}

export interface EngineeringBrief {
  location_lat: number;
  location_lng: number;
  planned_depth_m: number;
  location_name?: string;
  nearby_wells: NearbyWellSummary[];
  depth_risk_profile: DepthRiskInterval[];
  critical_events: any[];
  document_evidence: any[];
  regional_drilling_context?: RegionalDrillingContext;
  analog_wells?: any[];
  area_risk_summary: string;
  geological_context: string;
  data_confidence: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
  provenance_notes: string;
  total_wells_analyzed: number;
  radius_used_km: number;
  analysis_status: 'OK' | 'PARTIAL' | 'INSUFFICIENT_DATA';
}
