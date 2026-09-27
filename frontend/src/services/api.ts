import {
  Well, OffsetWellRelevance, FormationInterval, TrajectoryPoint,
  EventItem, DocumentItem, DocumentPageItem, AIQueryResponse,
  RiskPrediction, AlertItem, DataSource, ModelMetadata,
  EngineeringBrief, GeocodeResult
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }
  return res.json();
}

export const api = {
  // Wells
  async getWells(): Promise<Well[]> {
    const res = await fetch(`${API_BASE}/wells`);
    return handleResponse<Well[]>(res);
  },

  async getWell(wellId: string): Promise<Well> {
    const res = await fetch(`${API_BASE}/wells/${wellId}`);
    return handleResponse<Well>(res);
  },

  async getNearbyOffsets(wellId: string, radius: number = 15.0): Promise<OffsetWellRelevance[]> {
    const res = await fetch(`${API_BASE}/wells/nearby?well_id=${wellId}&radius=${radius}`);
    return handleResponse<OffsetWellRelevance[]>(res);
  },

  async getWellFormations(wellId: string): Promise<FormationInterval[]> {
    const res = await fetch(`${API_BASE}/wells/${wellId}/formations`);
    return handleResponse<FormationInterval[]>(res);
  },

  async getWellTrajectory(wellId: string): Promise<TrajectoryPoint[]> {
    const res = await fetch(`${API_BASE}/wells/${wellId}/trajectory`);
    return handleResponse<TrajectoryPoint[]>(res);
  },

  async getWellEvents(wellId: string): Promise<EventItem[]> {
    const res = await fetch(`${API_BASE}/wells/${wellId}/events`);
    return handleResponse<EventItem[]>(res);
  },

  async getWellDocuments(wellId: string): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/wells/${wellId}/documents`);
    return handleResponse<DocumentItem[]>(res);
  },

  // Formations
  async getCurrentFormation(wellId: string, depth: number): Promise<any> {
    const res = await fetch(`${API_BASE}/formations/current?well_id=${wellId}&depth=${depth}`);
    return handleResponse<any>(res);
  },

  // Documents
  async getDocuments(wellId?: string, documentType?: string): Promise<DocumentItem[]> {
    let url = `${API_BASE}/documents?limit=100`;
    if (wellId) url += `&well_id=${wellId}`;
    if (documentType) url += `&document_type=${documentType}`;
    const res = await fetch(url);
    return handleResponse<DocumentItem[]>(res);
  },

  async getDocumentPage(docId: string, page: number): Promise<DocumentPageItem> {
    const res = await fetch(`${API_BASE}/documents/${docId}/pages/${page}`);
    return handleResponse<DocumentPageItem>(res);
  },

  async ingestDocument(payload: {
    well_id: string;
    title: string;
    document_type: string;
    raw_text: string;
    date?: string;
    provenance?: string;
  }): Promise<{ status: string; document_id: string }> {
    const res = await fetch(`${API_BASE}/documents/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // AI & RAG
  async queryAI(payload: {
    query: string;
    well_id?: string;
    current_depth?: number;
    current_formation?: string;
  }): Promise<AIQueryResponse> {
    const res = await fetch(`${API_BASE}/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<AIQueryResponse>(res);
  },

  // Risk & ML
  async getCurrentRisk(wellId: string): Promise<RiskPrediction> {
    const res = await fetch(`${API_BASE}/risk/current?well_id=${wellId}`);
    return handleResponse<RiskPrediction>(res);
  },

  async getRiskHistory(wellId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/risk/history?well_id=${wellId}`);
    return handleResponse<any[]>(res);
  },

  // Alerts
  async getAlerts(wellId?: string, status?: string): Promise<AlertItem[]> {
    let url = `${API_BASE}/alerts`;
    const params = new URLSearchParams();
    if (wellId) params.append('well_id', wellId);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url);
    return handleResponse<AlertItem[]>(res);
  },

  async acknowledgeAlert(alertId: string, notes: string): Promise<AlertItem> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    return handleResponse<AlertItem>(res);
  },

  // Governance & Admin
  async getDataSources(): Promise<DataSource[]> {
    const res = await fetch(`${API_BASE}/data-sources`);
    return handleResponse<DataSource[]>(res);
  },

  async getModels(): Promise<ModelMetadata[]> {
    const res = await fetch(`${API_BASE}/models`);
    return handleResponse<ModelMetadata[]>(res);
  },

  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<any>(res);
  },

  async getAuditLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`);
    return handleResponse<any[]>(res);
  },

  // Telemetry Simulator Controls
  async startSimulator(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulator/start`, { method: 'POST' });
    return handleResponse(res);
  },

  async pauseSimulator(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulator/pause`, { method: 'POST' });
    return handleResponse(res);
  },

  async resetSimulator(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulator/reset`, { method: 'POST' });
    return handleResponse(res);
  },

  async setSimulatorSpeed(speed: number): Promise<any> {
    const res = await fetch(`${API_BASE}/simulator/speed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed })
    });
    return handleResponse(res);
  },

  // ── Location Analysis ──────────────────────────────────────────────────
  async analyzeLocation(payload: {
    lat: number;
    lng: number;
    planned_depth_m: number;
    location_name?: string;
  }): Promise<EngineeringBrief> {
    const res = await fetch(`${API_BASE}/location-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<EngineeringBrief>(res);
  },

  async geocodePlace(q: string): Promise<GeocodeResult[]> {
    const res = await fetch(`${API_BASE}/location-analysis/geocode?q=${encodeURIComponent(q)}`);
    return handleResponse<GeocodeResult[]>(res);
  },

  // ── National Research Manifest Intelligence ───────────────────────────
  async getResearchCoverage(): Promise<any> {
    const res = await fetch(`${API_BASE}/research/coverage`);
    return handleResponse<any>(res);
  },

  async getResearchAreas(params?: {
    q?: string;
    basin?: string;
    state?: string;
    priority?: string;
    tier?: string;
  }): Promise<any[]> {
    const sp = new URLSearchParams();
    if (params?.q) sp.append('q', params.q);
    if (params?.basin) sp.append('basin', params.basin);
    if (params?.state) sp.append('state', params.state);
    if (params?.priority) sp.append('priority', params.priority);
    if (params?.tier) sp.append('tier', params.tier);
    const qs = sp.toString();
    const res = await fetch(`${API_BASE}/research/areas${qs ? `?${qs}` : ''}`);
    return handleResponse<any[]>(res);
  },

  async getResearchArea(areaId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/research/areas/${encodeURIComponent(areaId)}`);
    return handleResponse<any>(res);
  },

  async getResearchContext(params: {
    lat: number;
    lng: number;
    location_name?: string;
    basin?: string;
  }): Promise<any> {
    const sp = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng)
    });
    if (params.location_name) sp.append('location_name', params.location_name);
    if (params.basin) sp.append('basin', params.basin);
    const res = await fetch(`${API_BASE}/research/context?${sp.toString()}`);
    return handleResponse<any>(res);
  },

  async refreshResearchIndex(): Promise<any> {
    const token = localStorage.getItem('nwis_token') || '';
    const res = await fetch(`${API_BASE}/research/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    return handleResponse<any>(res);
  }
};

