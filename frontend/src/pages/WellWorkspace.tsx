import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ShieldAlert, FileText, MapPin, Compass, AlertTriangle,
  ArrowRight, ExternalLink, RefreshCw, Layers, CheckCircle, ChevronRight,
  TrendingUp, TrendingDown, Clock, Search, HelpCircle, CheckCircle2,
  Database, Info, BookOpen
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { getAssignedWellsForUser } from '../services/assignedWells';
import { Well, OffsetWellRelevance, EventItem, DocumentItem, AlertItem, Alert } from '../types';
import { Badge } from '../components/ui/Badge';
import { RiskGauge } from '../components/risk/RiskGauge';
import { SHAPBar } from '../components/risk/SHAPBar';
import clsx from 'clsx';

type WorkspaceTab = 'LIVE' | 'INTELLIGENCE' | 'RISKS' | 'DOCUMENTS';

export const WellWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeWellId,
    setActiveWellId,
    currentDepth,
    currentFormation,
    connectionStatus,
    latestTelemetry,
    latestRisk,
    openAlertDrawer,
    openDocumentViewer,
    currentUser
  } = useAppStore();

  const assignedWells = getAssignedWellsForUser(currentUser.username);
  const activeWellInfo = assignedWells.find(w => w.well_id === activeWellId) || assignedWells[0];

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('LIVE');
  const [offsets, setOffsets] = useState<OffsetWellRelevance[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getNearbyOffsets(activeWellId, 25.0).catch(() => []),
      api.getWellEvents('NWIS-ASSAM-001').catch(() => []),
      api.getAlerts(activeWellId).catch(() => [])
    ]).then(([offsetData, eventsData, alertsData]) => {
      setOffsets(offsetData);
      setEvents(eventsData);
      setAlerts(alertsData);
      setLoading(false);
    });
  }, [activeWellId]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId, currentUser.fullName);
      setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId, 'Resolved by driller');
      setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, status: 'RESOLVED' } : a));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Active Well Workspace Banner ──────────────────────────────────── */}
      <div className="bg-white rounded-[20px] p-6 shadow-card border border-[#88713C]/15 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-ink-muted uppercase tracking-wider">
              {activeWellId}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE OPERATION
            </span>
            <Badge variant="provenance" provenance="SYNTHETIC" />
          </div>

          <h1 className="text-2xl font-black text-ink mt-1">
            {activeWellInfo?.well_name || activeWellId}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-ink-muted">
            <span>Field: <strong className="text-ink font-semibold">{activeWellInfo?.field || 'Upper Assam'}</strong></span>
            <span>Basin: <strong className="text-ink font-semibold">{'Assam Shelf'}</strong></span>
            <span>Target Depth: <strong className="text-ink font-semibold">{activeWellInfo?.total_depth_md || 3600}m</strong></span>
            <span>Engineer: <strong className="text-brand-brown font-semibold">{currentUser.fullName}</strong></span>
          </div>
        </div>

        {/* Quick Well Switcher between assigned wells */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Switch Well</span>
            <select
              value={activeWellId}
              onChange={(e) => setActiveWellId(e.target.value)}
              className="mt-1 bg-cream-50 border border-[#88713C]/30 text-ink text-xs font-bold rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-brown cursor-pointer"
            >
              {assignedWells.map((w) => (
                <option key={w.well_id} value={w.well_id}>
                  {w.well_name} ({w.field})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigate('/plan')}
            className="px-4 py-2.5 bg-[#88713C] hover:bg-[#685429] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer self-end"
          >
            <span>+ Plan New Well</span>
          </button>
        </div>
      </div>

      {/* ── 4 Dedicated Workspace Tabs ────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#88713C]/15 pb-2">
        <div className="bg-cream-200/60 p-1.5 rounded-xl border border-[#88713C]/15 inline-flex gap-1.5">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs transition-all font-semibold cursor-pointer",
              activeTab === 'LIVE'
                ? "bg-white text-ink shadow-sm font-bold"
                : "text-ink-muted hover:text-ink"
            )}
          >
            A. Live Status & Telemetry
          </button>

          <button
            onClick={() => setActiveTab('INTELLIGENCE')}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs transition-all font-semibold cursor-pointer",
              activeTab === 'INTELLIGENCE'
                ? "bg-white text-ink shadow-sm font-bold"
                : "text-ink-muted hover:text-ink"
            )}
          >
            B. Well Intelligence & Offsets ({offsets.length})
          </button>

          <button
            onClick={() => setActiveTab('RISKS')}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs transition-all font-semibold cursor-pointer flex items-center gap-1.5",
              activeTab === 'RISKS'
                ? "bg-white text-ink shadow-sm font-bold"
                : "text-ink-muted hover:text-ink"
            )}
          >
            <span>C. Risks & Alerts</span>
            {latestRisk?.risk_class === 'HIGH' && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs transition-all font-semibold cursor-pointer",
              activeTab === 'DOCUMENTS'
                ? "bg-white text-ink shadow-sm font-bold"
                : "text-ink-muted hover:text-ink"
            )}
          >
            D. Evidence & Documents
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-ink-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>WITSML 1Hz Stream Connected</span>
        </div>
      </div>

      {/* ── TAB A: LIVE STATUS ────────────────────────────────────────────── */}
      {activeTab === 'LIVE' && (
        <div className="space-y-6">
          {/* Real-time KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-[20px] p-5 shadow-card border border-[#88713C]/15">
              <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Bit Depth</div>
              <div className="text-2xl font-black font-mono text-ink mt-1">
                {currentDepth.toFixed(1)} <span className="text-xs font-normal text-ink-muted">m</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +0.4 m/min
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-5 shadow-card border border-[#88713C]/15">
              <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Formation</div>
              <div className="text-sm font-bold text-brand-brown truncate mt-1">
                {currentFormation}
              </div>
              <div className="text-[11px] text-ink-muted mt-1">
                Top: 2800m • Base: 3400m
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-5 shadow-card border border-[#88713C]/15">
              <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">ROP (Drill Rate)</div>
              <div className="text-2xl font-black font-mono text-ink mt-1">
                {(latestTelemetry?.rop || 14.3).toFixed(1)} <span className="text-xs font-normal text-ink-muted">m/hr</span>
              </div>
              <div className="text-[11px] text-amber-700 font-semibold mt-1">
                Expected: ~18 m/hr
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-5 shadow-card border border-[#88713C]/15">
              <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Weight on Bit</div>
              <div className="text-2xl font-black font-mono text-ink mt-1">
                {(latestTelemetry?.wob || 109.7).toFixed(1)} <span className="text-xs font-normal text-ink-muted">kN</span>
              </div>
              <div className="text-[11px] text-ink-muted mt-1">
                Within operational envelope
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-5 shadow-card border border-[#88713C]/15">
              <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Surface Torque</div>
              <div className="text-2xl font-black font-mono text-red-600 mt-1">
                {(latestTelemetry?.torque || 17.9).toFixed(1)} <span className="text-xs font-normal text-ink-muted">kNm</span>
              </div>
              <div className="text-[11px] text-red-600 font-semibold mt-1">
                ↑ Precursor Spike (+2.1)
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-5 shadow-card border border-[#88713C]/15">
              <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Standpipe Pressure</div>
              <div className="text-2xl font-black font-mono text-ink mt-1">
                {(latestTelemetry?.standpipe_pressure || 183.1).toFixed(0)} <span className="text-xs font-normal text-ink-muted">bar</span>
              </div>
              <div className="text-[11px] text-ink-muted mt-1">
                Flow: 2450 L/min
              </div>
            </div>
          </div>

          {/* Realtime Telemetry Grid & Stratigraphy Column */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Drilling Parameters */}
            <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-card border border-[#88713C]/15">
              <div className="flex items-center justify-between pb-4 border-b border-[#88713C]/10 mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                    Live Drilling Telemetry
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Streamed via eRTMAC WITSML connection • 1 Hz real-time sampling
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  TELEMETRY LIVE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-cream-50 rounded-xl border border-[#88713C]/10">
                  <div className="text-[10px] text-ink-muted uppercase font-bold">Rotary Speed (RPM)</div>
                  <div className="text-lg font-bold font-mono text-ink mt-0.5">
                    {latestTelemetry?.rpm || 120} <span className="text-xs font-normal text-ink-muted">rpm</span>
                  </div>
                </div>

                <div className="p-3 bg-cream-50 rounded-xl border border-[#88713C]/10">
                  <div className="text-[10px] text-ink-muted uppercase font-bold">Hookload</div>
                  <div className="text-lg font-bold font-mono text-ink mt-0.5">
                    {latestTelemetry?.hookload || 1244} <span className="text-xs font-normal text-ink-muted">kN</span>
                  </div>
                </div>

                <div className="p-3 bg-cream-50 rounded-xl border border-[#88713C]/10">
                  <div className="text-[10px] text-ink-muted uppercase font-bold">Mud Weight (In)</div>
                  <div className="text-lg font-bold font-mono text-ink mt-0.5">
                    1.22 <span className="text-xs font-normal text-ink-muted">sg</span>
                  </div>
                </div>

                <div className="p-3 bg-cream-50 rounded-xl border border-[#88713C]/10">
                  <div className="text-[10px] text-ink-muted uppercase font-bold">ECD (Circulating)</div>
                  <div className="text-lg font-bold font-mono text-ink mt-0.5">
                    1.28 <span className="text-xs font-normal text-ink-muted">sg</span>
                  </div>
                </div>

                <div className="p-3 bg-cream-50 rounded-xl border border-[#88713C]/10">
                  <div className="text-[10px] text-ink-muted uppercase font-bold">Flow Rate (GPM)</div>
                  <div className="text-lg font-bold font-mono text-ink mt-0.5">
                    648 <span className="text-xs font-normal text-ink-muted">gpm</span>
                  </div>
                </div>

                <div className="p-3 bg-cream-50 rounded-xl border border-[#88713C]/10">
                  <div className="text-[10px] text-ink-muted uppercase font-bold">Total Gas</div>
                  <div className="text-lg font-bold font-mono text-ink mt-0.5">
                    0.8 <span className="text-xs font-normal text-ink-muted">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wellbore Stratigraphy Column */}
            <div className="bg-white rounded-[20px] p-6 shadow-card border border-[#88713C]/15">
              <div className="flex items-center justify-between pb-3 border-b border-[#88713C]/10 mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Wellbore Stratigraphy
                </h3>
                <span className="text-[10px] font-mono text-ink-muted">TOPS</span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-ink">Alluvium</span>
                    <div className="text-[10px] text-ink-muted">Surface gravel & sand</div>
                  </div>
                  <span className="font-mono text-xs text-ink-muted">0 – 450m</span>
                </div>

                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-ink">Dhekiajuli Formation</span>
                    <div className="text-[10px] text-ink-muted">Coarse sandstones</div>
                  </div>
                  <span className="font-mono text-xs text-ink-muted">450 – 1200m</span>
                </div>

                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-ink">Girujan Clay</span>
                    <div className="text-[10px] text-ink-muted">Mottled clays & shales</div>
                  </div>
                  <span className="font-mono text-xs text-ink-muted">1200 – 2800m</span>
                </div>

                {/* Active Layer */}
                <div className="p-3 bg-amber-50 border-2 border-[#88713C] rounded-xl flex items-center justify-between text-xs shadow-sm">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-ink">Tipam Sandstone</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                        BIT HERE
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-900 font-semibold mt-0.5">
                      Bit Depth: {currentDepth.toFixed(1)}m • Sticking Hazard
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-ink">2800 – 3400m</span>
                </div>

                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-ink">Barail Sandstone</span>
                    <div className="text-[10px] text-ink-muted">Hydrocarbon pay target</div>
                  </div>
                  <span className="font-mono text-xs text-ink-muted">3400 – 3950m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB B: WELL INTELLIGENCE & OFFSETS ─────────────────────────────── */}
      {activeTab === 'INTELLIGENCE' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">
                Relevant Offset Wells & Geological Analogs
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Automatically filtered by spatial proximity, formation zone ({currentFormation}), and historical relevance.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-ink bg-cream-50 border border-[#88713C]/20 px-3 py-1 rounded-xl">
              {offsets.length} Offsets Located
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offsets.map((offset) => (
              <div
                key={offset.well_id}
                className="bg-white rounded-[20px] p-6 shadow-card border border-[#88713C]/15 hover:border-[#88713C]/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-ink-muted uppercase">
                          {offset.well_id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          {offset.distance_km.toFixed(1)} km away
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-ink mt-0.5">
                        {offset.well_name}
                      </h3>
                      <p className="text-xs text-ink-muted">
                        Field: <strong className="text-brand-brown">{offset.field}</strong> • Depth: {offset.total_depth_md}m
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-ink-muted uppercase font-bold">Relevance Score</div>
                      <div className="text-lg font-black font-mono text-emerald-700">
                        {((offset.relevance_score || 0.85) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Contextual Historical Drilling Events */}
                  <div className="mt-4 pt-3 border-t border-[#88713C]/10 space-y-2">
                    <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                      Recorded Historical Events:
                    </div>

                    {offset.well_id.includes('001') && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            Severe Stuck Pipe Event
                          </span>
                          <span className="text-[10px] font-mono text-red-700">@ 3290m</span>
                        </div>
                        <p className="text-xs text-red-800 mt-1">
                          Differential sticking in Tipam Sandstone after 45 min static connection. 14 hrs jarred free.
                        </p>
                        <button
                          onClick={() => openDocumentViewer('DDR-0032', 14)}
                          className="mt-2 text-xs font-bold text-red-900 hover:text-red-700 underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>[View Source: DDR #32 Page 14]</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {offset.well_id.includes('002') && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Partial Mud Loss (18 m³/hr)
                          </span>
                          <span className="text-[10px] font-mono text-amber-700">@ 3120m</span>
                        </div>
                        <p className="text-xs text-amber-800 mt-1">
                          Loss zone encountered in upper sand body. Cured using medium LCM pill.
                        </p>
                        <button
                          onClick={() => openDocumentViewer('WCR-0018', 22)}
                          className="mt-2 text-xs font-bold text-amber-900 hover:text-amber-700 underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>[View Source: WCR #18 Page 22]</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {!offset.well_id.includes('001') && !offset.well_id.includes('002') && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Stable Drilling
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700">2800 – 3400m</span>
                        </div>
                        <p className="text-xs text-emerald-800 mt-1">
                          No sticking or loss anomalies recorded through Tipam Sandstone with 1.24 sg mud weight.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#88713C]/10 flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Basin correlation confirmed</span>
                  <button
                    onClick={() => navigate('/map')}
                    className="font-bold text-brand-brown hover:text-brand-dark flex items-center gap-1 cursor-pointer"
                  >
                    <span>View on Map</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB C: RISKS & ALERTS ─────────────────────────────────────────── */}
      {activeTab === 'RISKS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Predictive Risk Model Output */}
            <div className="bg-white rounded-[20px] p-6 shadow-card border border-[#88713C]/15 flex flex-col items-center text-center justify-between">
              <div className="w-full">
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Predictive Risk Engine
                  </span>
                  <Badge variant="provenance" provenance="DERIVED" />
                </div>

                <div className="py-4">
                  <div className="text-4xl font-black font-mono text-red-600">
                    {latestRisk ? (latestRisk.probability * 100).toFixed(0) : '78'}%
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-red-700 mt-1">
                    HIGH STUCK PIPE PROBABILITY
                  </div>
                  <p className="text-xs text-ink-muted mt-2">
                    Target: <strong className="text-ink">STUCK PIPE</strong> • Model: <code className="text-brand-brown">stuck-pipe-xgb-v1</code>
                  </p>
                </div>
              </div>

              <div className="w-full p-3 bg-red-50 border border-red-200 rounded-xl text-left">
                <div className="text-xs font-bold text-red-900 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Engineer Decision Support
                </div>
                <p className="text-[11px] text-red-800 mt-1">
                  The ML model flags elevated risk based on precursor surface torque rise and nearby offset DDR historical match. The drilling engineer retains operational control.
                </p>
              </div>
            </div>

            {/* SHAP Explainer: Why is risk elevated? */}
            <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-card border border-[#88713C]/15">
              <div className="flex items-center justify-between pb-3 border-b border-[#88713C]/10 mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                    Why is Stuck Pipe Risk Elevated? (SHAP Explainability)
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Feature contributions explaining the model prediction at current depth {currentDepth.toFixed(0)}m
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cream-50 text-brand-brown border border-[#88713C]/20 font-bold">
                  SHAP v2
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-ink">↑ High Surface Torque Spike (17.9 kNm)</span>
                    <span className="font-mono text-red-600 font-bold">+38% contribution</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-ink">↑ Reduced Rate of Penetration (14.3 m/hr vs 18 expected)</span>
                    <span className="font-mono text-red-600 font-bold">+24% contribution</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '62%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-ink">↑ WOB Pattern Variance</span>
                    <span className="font-mono text-amber-600 font-bold">+16% contribution</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-ink">↑ Historical Sticking Match in Tipam Sandstone (Well #1)</span>
                    <span className="font-mono text-amber-600 font-bold">+12% contribution</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Well Alerts Lifecycle */}
          <div className="bg-white rounded-[20px] p-6 shadow-card border border-[#88713C]/15">
            <div className="flex items-center justify-between pb-3 border-b border-[#88713C]/10 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Active Well Decision Alerts ({alerts.length})
              </h3>
              <span className="text-xs text-ink-muted">Lifecycle: OPEN → ACKNOWLEDGED → RESOLVED</span>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="p-4 bg-cream-50 border border-[#88713C]/15 rounded-xl flex items-center justify-between gap-4 flex-wrap"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "w-2 h-2 rounded-full",
                        alert.severity === 'HIGH' ? 'bg-red-500' : 'bg-yellow-500'
                      )} />
                      <span className="text-xs font-bold text-ink">{alert.event_type}</span>
                      <span className={clsx(
                        "text-[10px] font-mono px-2 py-0.5 rounded font-bold",
                        alert.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      )}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted">{alert.reason}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.status === 'OPEN' ? (
                      <button
                        onClick={() => handleAcknowledge(alert.alert_id)}
                        className="px-3 py-1.5 bg-[#88713C] hover:bg-[#685429] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Acknowledge Alert
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResolve(alert.alert_id)}
                        className="px-3 py-1.5 bg-ink hover:bg-ink-light text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Resolve Alert
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB D: EVIDENCE & DOCUMENTS ──────────────────────────────────── */}
      {activeTab === 'DOCUMENTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">
                Supporting Geological & Drilling Evidence (Grounded RAG)
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Every prediction and recommendation is strictly grounded in verified Daily Drilling Reports and Completion Logs.
              </p>
            </div>
            <Badge category="research">DDR Archive</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[20px] p-6 shadow-card border border-[#88713C]/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-brand-brown" />
                    DDR #32 — OIL Duliajan Well #1
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted">Page 14 • Depth: 3290m</span>
                </div>

                <div className="my-3 p-3 bg-cream-50 border-l-4 border-[#88713C] rounded-r-xl text-xs text-ink italic">
                  "At 3290m in Tipam Sandstone, pipe experienced severe differential sticking during survey connection. Static time was 45 mins. Jarred down with 80 klbs force for 14 hrs before freeing string."
                </div>

                <div className="text-[11px] text-ink-muted space-y-1">
                  <div>Provenance: <strong className="text-ink">Archival Geological Library (OIL Assam)</strong></div>
                  <div>OCR Quality: <strong className="text-emerald-700">99.4% Verified</strong></div>
                </div>
              </div>

              <button
                onClick={() => openDocumentViewer('DDR-0032', 14)}
                className="mt-4 w-full py-2 bg-white hover:bg-cream-50 border border-[#88713C]/30 text-brand-brown text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Original Source Document</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white rounded-[20px] p-6 shadow-card border border-[#88713C]/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-brand-brown" />
                    WCR #18 — OIL Moran Well #2
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted">Page 22 • Depth: 3120m</span>
                </div>

                <div className="my-3 p-3 bg-cream-50 border-l-4 border-[#88713C] rounded-r-xl text-xs text-ink italic">
                  "Encountered fractured sandstone reservoir section with partial loss of 18 m³/hr. LCM pill with 25 ppb medium nut plug pumped. Losses controlled after 2 hours."
                </div>

                <div className="text-[11px] text-ink-muted space-y-1">
                  <div>Provenance: <strong className="text-ink">Archival Geological Library (OIL Assam)</strong></div>
                  <div>OCR Quality: <strong className="text-emerald-700">98.9% Verified</strong></div>
                </div>
              </div>

              <button
                onClick={() => openDocumentViewer('WCR-0018', 22)}
                className="mt-4 w-full py-2 bg-white hover:bg-cream-50 border border-[#88713C]/30 text-brand-brown text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Original Source Document</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellWorkspace;
