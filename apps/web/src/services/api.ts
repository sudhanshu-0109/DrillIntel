import {
  Well, OffsetWellRelevance, FormationInterval, TrajectoryPoint,
  EventItem, DocumentItem, DocumentPageItem, AIQueryResponse,
  RiskPrediction, AlertItem, DataSource, ModelMetadata
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
    const res = await fetch('http://localhost:8000/api/data-sources');
    return handleResponse<DataSource[]>(res);
  },

  async getModels(): Promise<ModelMetadata[]> {
    const res = await fetch('http://localhost:8000/api/models');
    return handleResponse<ModelMetadata[]>(res);
  },

  async getHealth(): Promise<any> {
    const res = await fetch('http://localhost:8000/api/health');
    return handleResponse<any>(res);
  },

  // Telemetry Simulator Controls
  async startSimulator(): Promise<any> {
    const res = await fetch('http://localhost:8000/api/simulator/start', { method: 'POST' });
    return handleResponse(res);
  },

  async pauseSimulator(): Promise<any> {
    const res = await fetch('http://localhost:8000/api/simulator/pause', { method: 'POST' });
    return handleResponse(res);
  },

  async resetSimulator(): Promise<any> {
    const res = await fetch('http://localhost:8000/api/simulator/reset', { method: 'POST' });
    return handleResponse(res);
  },

  async setSimulatorSpeed(speed: number): Promise<any> {
    const res = await fetch('http://localhost:8000/api/simulator/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed })
    });
    return handleResponse(res);
  }
};
