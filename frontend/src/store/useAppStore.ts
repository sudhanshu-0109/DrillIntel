import { create } from 'zustand';
import { RealTimeDataPoint, RiskPrediction, AlertItem } from '../types';

export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'STALE' | 'DISCONNECTED';

interface AppState {
  activeWellId: string;
  selectedOffsetId: string | null;
  currentDepth: number;
  currentFormation: string;
  
  // Realtime Telemetry
  connectionStatus: ConnectionStatus;
  isSimulatorRunning: boolean;
  simulatorSpeed: number;
  latestTelemetry: RealTimeDataPoint | null;
  telemetryHistory: RealTimeDataPoint[];
  lastUpdateTimestamp: string | null;
  
  // ML Risk & Explainability
  latestRisk: RiskPrediction | null;
  
  // Context Drawer State
  activeDrawer: 'alert' | 'offset' | 'document' | null;
  selectedAlert: AlertItem | null;
  selectedDocViewer: { documentId: string; pageNumber: number } | null;
  
  // User state
  currentUser: {
    username: string;
    fullName: string;
    role: string;
  };
  
  // Actions
  setActiveWellId: (wellId: string) => void;
  setSelectedOffsetId: (offsetId: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setSimulatorRunning: (running: boolean) => void;
  setSimulatorSpeed: (speed: number) => void;
  updateTelemetry: (point: RealTimeDataPoint, prediction?: RiskPrediction) => void;
  openAlertDrawer: (alert: AlertItem) => void;
  openDocumentViewer: (documentId: string, pageNumber?: number) => void;
  closeDrawer: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeWellId: 'NWIS-ASSAM-003',
  selectedOffsetId: 'NWIS-ASSAM-001',
  currentDepth: 3280.0,
  currentFormation: 'Tipam Sandstone',
  
  connectionStatus: 'CONNECTED',
  isSimulatorRunning: false,
  simulatorSpeed: 1.0,
  latestTelemetry: {
    well_id: 'NWIS-ASSAM-003',
    timestamp: new Date().toISOString(),
    measured_depth: 3280.0,
    rop: 14.2,
    wob: 110.0,
    rpm: 120.0,
    torque: 18.5,
    hookload: 1250.0,
    standpipe_pressure: 182.0,
    flow_in: 2400.0,
    flow_out: 2395.0,
    mud_weight: 1.22,
    ecd: 1.44,
    formation: 'Tipam Sandstone'
  },
  telemetryHistory: [],
  lastUpdateTimestamp: new Date().toISOString(),
  
  latestRisk: {
    prediction_id: 'PRED-003-INIT',
    well_id: 'NWIS-ASSAM-003',
    event_type: 'stuck_pipe',
    probability: 0.87,
    risk_class: 'HIGH',
    prediction_timestamp: new Date().toISOString(),
    model_version: 'stuck-pipe-xgb-v1',
    depth: 3280.0,
    formation: 'Tipam Sandstone',
    top_features: [
      { feature_name: 'delta_torque_15m', display_name: 'Torque Rate of Change (+15m)', feature_value: 16.2, impact: 'INCREASES_RISK' },
      { feature_name: 'rop_drop_ratio', display_name: 'ROP Drop Index', feature_value: 0.81, impact: 'INCREASES_RISK' }
    ],
    explanation: 'Torque increased rapidly (+16.2 kNm) while ROP decreased by 80% and standpipe pressure remained elevated in permeable Tipam Sandstone.',
    shap_contributors: [
      { feature_name: 'delta_torque_15m', display_name: 'Torque Rate of Change (+15m)', feature_value: 16.2, shap_value: 0.45, impact: 'INCREASES_RISK' },
      { feature_name: 'rop_drop_ratio', display_name: 'ROP Drop Index', feature_value: 0.81, shap_value: 0.26, impact: 'INCREASES_RISK' },
      { feature_name: 'torque_rolling_std', display_name: 'Torque Volatility', feature_value: 3.2, shap_value: 0.14, impact: 'INCREASES_RISK' },
      { feature_name: 'formation_permeability', display_name: 'Tipam Sandstone Context', feature_value: 1.0, shap_value: 0.12, impact: 'INCREASES_RISK' }
    ],
    data_quality: 'NOMINAL'
  },
  
  activeDrawer: null,
  selectedAlert: null,
  selectedDocViewer: null,
  
  currentUser: {
    username: 'driller_piter',
    fullName: 'Piter Saikia',
    role: 'DRILLING_ENGINEER'
  },
  
  setActiveWellId: (wellId) => set({ activeWellId: wellId }),
  setSelectedOffsetId: (offsetId) => set({ selectedOffsetId: offsetId }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setSimulatorRunning: (running) => set({ isSimulatorRunning: running }),
  setSimulatorSpeed: (speed) => set({ simulatorSpeed: speed }),
  updateTelemetry: (point, prediction) => set((state) => {
    const updatedHistory = [...state.telemetryHistory, point];
    if (updatedHistory.length > 50) {
      updatedHistory.shift();
    }
    return {
      latestTelemetry: point,
      telemetryHistory: updatedHistory,
      currentDepth: point.measured_depth,
      currentFormation: point.formation,
      lastUpdateTimestamp: point.timestamp,
      latestRisk: prediction || state.latestRisk,
      connectionStatus: 'CONNECTED'
    };
  }),
  openAlertDrawer: (alert) => set({ activeDrawer: 'alert', selectedAlert: alert }),
  openDocumentViewer: (documentId, pageNumber = 1) => set({
    activeDrawer: 'document',
    selectedDocViewer: { documentId, pageNumber }
  }),
  closeDrawer: () => set({ activeDrawer: null, selectedAlert: null, selectedDocViewer: null })
}));
