import React, { useEffect, useState } from 'react';
import {
  Activity, ShieldAlert, FileText, MapPin, Compass, AlertTriangle,
  ArrowRight, ExternalLink, RefreshCw, Layers, CheckCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { Well, OffsetWellRelevance, EventItem, DocumentItem, AlertItem } from '../types';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { RiskGauge } from '../components/risk/RiskGauge';
import { SHAPBar } from '../components/risk/SHAPBar';
import { Link } from 'react-router-dom';

export const CommandCenter: React.FC = () => {
  const {
    activeWellId,
    currentDepth,
    currentFormation,
    connectionStatus,
    latestTelemetry,
    latestRisk,
    openAlertDrawer,
    openDocumentViewer
  } = useAppStore();

  const [activeWell, setActiveWell] = useState<Well | null>(null);
  const [offsets, setOffsets] = useState<OffsetWellRelevance[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getWell(activeWellId).catch(() => null),
      api.getNearbyOffsets(activeWellId, 15.0).catch(() => []),
      api.getWellEvents('NWIS-ASSAM-001').catch(() => []),
      api.getAlerts(activeWellId).catch(() => [])
    ]).then(([wellData, offsetData, eventsData, alertsData]) => {
      if (wellData) setActiveWell(wellData);
      setOffsets(offsetData);
      setRecentEvents(eventsData);
      setAlerts(alertsData);
      setLoading(false);
    });
  }, [activeWellId]);

  return (
    <div className="space-y-6">
      {/* Header Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Good morning, Piter 👋
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Monitoring active operations on <strong className="text-ink font-semibold">{activeWellId}</strong>.
            Geospatial correlation active across {offsets.length} nearby Upper Assam offset wells.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/live"
            className="px-4 py-2 bg-white hover:bg-cream-50 text-ink text-xs font-bold rounded-xl border border-[#88713C]/20 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4 text-sky-600" />
            <span>Telemetry Center</span>
          </Link>
          <Link
            to="/map"
            className="px-4 py-2 bg-ink hover:bg-ink-light text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4 text-[#F5D867]" />
            <span>Offset Wells Map</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Current Depth"
          value={currentDepth.toFixed(1)}
          unit="m"
          subtext="Drilling in progress"
          trend="up"
          trendValue="+0.4 m/min"
          category="live"
        />

        <MetricCard
          label="Formation"
          value={currentFormation.split(' ')[0]}
          subtext={currentFormation}
          badge={<Badge category="geo">Geology</Badge>}
        />

        <MetricCard
          label="Offset Wells"
          value={offsets.length}
          unit="wells"
          subtext="Within 15 km radius"
          badge={<Badge category="ops">Spatial</Badge>}
        />

        <MetricCard
          label="Active Risks"
          value={latestRisk?.risk_class === 'HIGH' ? '1 HIGH' : '0'}
          subtext={latestRisk ? `Stuck Pipe (${(latestRisk.probability * 100).toFixed(0)}%)` : 'Normal'}
          badge={
            <Badge variant="severity" severity={latestRisk?.risk_class || 'LOW'}>
              {latestRisk?.risk_class || 'LOW'}
            </Badge>
          }
        />

        <MetricCard
          label="Realtime Link"
          value={connectionStatus}
          subtext="WITSML 1Hz Stream"
          trend="neutral"
          trendValue="1.2 ms"
          badge={<Badge category="live">eRTMAC</Badge>}
        />

        <MetricCard
          label="Historical Cases"
          value={recentEvents.length > 0 ? recentEvents.length : 3}
          unit="events"
          subtext="Tipam Sandstone zone"
          badge={<Badge category="research">DDR Archive</Badge>}
        />
      </div>

      {/* Main Working Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Well Stratigraphy Track (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Wellbore Stratigraphy
              </h3>
              <Badge category="geo">Formation Tops</Badge>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Alluvium', top: 0, bottom: 450, color: 'bg-amber-100 border-amber-300' },
                { name: 'Dhekiajuli', top: 450, bottom: 1200, color: 'bg-yellow-100 border-yellow-300' },
                { name: 'Girujan Clay', top: 1200, bottom: 2800, color: 'bg-emerald-100 border-emerald-300' },
                { name: 'Tipam Sandstone', top: 2800, bottom: 3400, color: 'bg-[#F5D867]/40 border-[#88713C]', active: true },
                { name: 'Barail Sandstone', top: 3400, bottom: 3950, color: 'bg-purple-100 border-purple-300' },
              ].map((f, idx) => {
                const isCurrent = f.active;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs transition-all relative ${
                      isCurrent
                        ? 'border-brand-brown bg-[#FAF2DF] shadow-sm font-semibold'
                        : 'border-gray-200 bg-white/60 text-ink-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={isCurrent ? "text-ink font-bold" : "text-ink"}>{f.name}</span>
                      <span className="font-mono text-[11px] text-ink-muted">{f.top} - {f.bottom}m</span>
                    </div>
                    {isCurrent && (
                      <div className="mt-2 flex items-center justify-between text-[11px] text-brand-dark pt-1 border-t border-brand-brown/20">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-brown animate-ping" />
                          Bit Depth: <strong>{currentDepth.toFixed(1)}m</strong>
                        </span>
                        <span className="font-mono text-red-700 font-bold">Sticking Hazard</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between text-xs text-ink-muted">
              <span>Planned TD: <strong>3850m</strong></span>
              <span>Mud Weight: <strong>1.22 SG</strong></span>
            </div>
          </div>

          {/* Quick Offset Relevance Card */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Nearest Offset Wells
              </h3>
              <Link to="/map" className="text-xs text-brand-brown font-bold hover:underline flex items-center gap-0.5">
                View Map <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {offsets.slice(0, 3).map((off) => (
                <div
                  key={off.well_id}
                  className="p-3 bg-cream-50 hover:bg-cream-200/50 rounded-xl border border-cream-200 transition-all text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span>{off.well_id}</span>
                    <span className="text-brand-brown font-mono font-bold">{off.relevance_score.toFixed(0)}% Score</span>
                  </div>
                  <div className="text-[11px] text-ink-muted mt-1 flex justify-between">
                    <span>Dist: <strong>{off.distance_km} km</strong> ({off.azimuth_deg}°)</span>
                    <span>Overlap: <strong>{off.depth_overlap_m.toFixed(0)}m</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Live Drilling Parameters & Realtime Dynamics (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Live Drilling Parameters
                </h3>
                <span className="text-xs text-ink-muted">
                  Streamed via eRTMAC WebSocket • 1Hz Sampling
                </span>
              </div>
              <Badge variant="provenance" provenance="SYNTHETIC" />
            </div>

            {/* Parameter Gauges / Readouts */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Torque - Highlighted as key precursor */}
              <div className="p-3.5 rounded-xl border bg-amber-50/70 border-amber-200">
                <div className="flex items-center justify-between text-xs text-amber-900 font-semibold mb-1">
                  <span>Surface Torque</span>
                  <span className="text-[10px] font-bold text-red-700 uppercase">Precursor Rise</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-amber-950 font-mono">
                    {latestTelemetry?.torque.toFixed(1) || '18.5'}
                  </span>
                  <span className="text-xs font-semibold text-amber-800">kNm</span>
                </div>
                <div className="mt-1 text-[11px] text-amber-800">Baseline: 18.0 kNm (+{((latestTelemetry?.torque || 18.5) - 18.0).toFixed(1)})</div>
              </div>

              {/* ROP */}
              <div className="p-3.5 rounded-xl border bg-sky-50/70 border-sky-200">
                <div className="flex items-center justify-between text-xs text-sky-900 font-semibold mb-1">
                  <span>Rate of Penetration</span>
                  <span className="text-[10px] font-bold text-sky-800">ROP</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-sky-950 font-mono">
                    {latestTelemetry?.rop.toFixed(1) || '14.2'}
                  </span>
                  <span className="text-xs font-semibold text-sky-800">m/hr</span>
                </div>
                <div className="mt-1 text-[11px] text-sky-800">Expected: ~14.0 m/hr</div>
              </div>

              {/* SPP */}
              <div className="p-3 rounded-xl border bg-cream-50 border-cream-200">
                <div className="text-xs text-ink-muted font-medium mb-1">Standpipe Pressure</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-ink font-mono">
                    {latestTelemetry?.standpipe_pressure.toFixed(1) || '182.0'}
                  </span>
                  <span className="text-xs text-ink-muted">bar</span>
                </div>
              </div>

              {/* Hookload */}
              <div className="p-3 rounded-xl border bg-cream-50 border-cream-200">
                <div className="text-xs text-ink-muted font-medium mb-1">Hookload</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-ink font-mono">
                    {latestTelemetry?.hookload.toFixed(0) || '1250'}
                  </span>
                  <span className="text-xs text-ink-muted">kN</span>
                </div>
              </div>

              {/* WOB */}
              <div className="p-3 rounded-xl border bg-cream-50 border-cream-200">
                <div className="text-xs text-ink-muted font-medium mb-1">Weight on Bit</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-ink font-mono">
                    {latestTelemetry?.wob.toFixed(1) || '110.0'}
                  </span>
                  <span className="text-xs text-ink-muted">kN</span>
                </div>
              </div>

              {/* Rotary RPM */}
              <div className="p-3 rounded-xl border bg-cream-50 border-cream-200">
                <div className="text-xs text-ink-muted font-medium mb-1">Rotary Speed</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-ink font-mono">
                    {latestTelemetry?.rpm.toFixed(0) || '120'}
                  </span>
                  <span className="text-xs text-ink-muted">rpm</span>
                </div>
              </div>
            </div>

            {/* Physics Indicators */}
            <div className="p-3.5 bg-cream-50/90 rounded-xl border border-cream-200 text-xs space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-ink-muted">Equivalent Circulating Density (ECD):</span>
                <span className="font-mono text-ink font-bold">{latestTelemetry?.ecd.toFixed(2) || '1.44'} SG</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-ink-muted">Fracture Margin Window:</span>
                <span className="text-emerald-700 font-semibold">+0.38 SG (Safe)</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-ink-muted">Pore Pressure Gradient:</span>
                <span className="font-mono text-ink">1.18 SG (Tipam)</span>
              </div>
            </div>
          </div>

          {/* Historical Offset Evidence (DDR-0032 Page 14) */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-brown" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Historical Analogue Evidence
                </h3>
              </div>
              <Badge category="research">Institutional Memory</Badge>
            </div>

            <div className="bg-[#FFFDF9] border border-[#88713C]/20 rounded-xl p-4 text-xs space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink text-sm">NWIS-ASSAM-001 (Offset)</span>
                  <div className="text-ink-muted text-[11px]">3.4 km East • Spud: 2024-05-14</div>
                </div>
                <Badge variant="severity" severity="HIGH">Historical Stuck Pipe</Badge>
              </div>

              <p className="text-ink-muted leading-relaxed">
                Stuck pipe occurred at <strong>3268m MD</strong> in <strong>Tipam Sandstone</strong> when surface torque escalated from 18 to 34 kNm.
                Formation differential sticking observed during connection under 0.15 SG overbalance.
              </p>

              <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => openDocumentViewer('DDR-0032', 14)}
                  className="text-xs font-bold text-brand-brown hover:text-brand-dark flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Inspect DDR-0032 (Page 14 Evidence)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-gray-500 font-mono">DDR-0032 • Pg 14</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: ML Risk Engine, SHAP, and Decision Alerts (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* ML Risk & SHAP Card */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Predictive Risk Engine
              </h3>
              <Badge variant="provenance" provenance="DERIVED" />
            </div>

            {/* Risk Gauge */}
            {latestRisk && (
              <RiskGauge
                probability={latestRisk.probability}
                riskClass={latestRisk.risk_class}
                eventType={latestRisk.event_type}
                modelVersion={latestRisk.model_version}
              />
            )}

            {/* SHAP Contributors & Plain Language Explanation */}
            {latestRisk && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <SHAPBar
                  contributors={latestRisk.shap_contributors || []}
                  plainExplanation={latestRisk.explanation}
                />
              </div>
            )}
          </div>

          {/* Decision Alerts Card */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Decision Alerts
                </h3>
              </div>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                {alerts.filter(a => a.status === 'OPEN').length} Open
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((alt) => (
                <div
                  key={alt.alert_id}
                  onClick={() => openAlertDrawer(alt)}
                  className="p-3.5 rounded-xl border border-red-200/90 bg-red-50/50 hover:bg-red-50 cursor-pointer transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="severity" severity={alt.severity}>
                      {alt.severity} RISK
                    </Badge>
                    <span className="font-mono text-[10px] text-ink-muted">{alt.alert_id}</span>
                  </div>

                  <div className="font-bold text-ink">
                    Potential Stuck Pipe in {alt.formation}
                  </div>

                  <p className="text-ink-muted text-[11px] line-clamp-2">
                    {alt.reason}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-red-200/50 text-[11px]">
                    <span className="text-red-800 font-semibold">
                      Prob: {(alt.probability * 100).toFixed(0)}% • {alt.depth.toFixed(1)}m
                    </span>
                    <span className="text-brand-brown font-bold flex items-center gap-0.5">
                      Review & Acknowledge <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
