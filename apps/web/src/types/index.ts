export type ProvenanceType = 'PUBLIC' | 'AUTHORIZED' | 'SYNTHETIC' | 'DERIVED';

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
  top_features: any[];
  explanation: string;
  shap_contributors: SHAPContributor[];
  data_quality: string;
}

export interface AlertItem {
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

export interface RAGEvidenceItem {
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
  provenance: ProvenanceType;
}

export interface AIQueryResponse {
  query: string;
  active_well_id?: string;
  depth_context?: number;
  formation_context?: string;
  interpretation: string;
  retrieved_evidence: RAGEvidenceItem[];
  confidence_level: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_EVIDENCE';
  evidence_status: 'STRONG_EVIDENCE' | 'PARTIAL_EVIDENCE' | 'INSUFFICIENT_EVIDENCE';
  model_used: string;
}

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
