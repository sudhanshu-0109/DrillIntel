import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Gauge, Building2, AlertTriangle, CheckCircle2,
  XCircle, Info, FileText, ChevronDown, ChevronUp, Layers,
  Shield, Activity, Navigation, TrendingUp, BookOpen, Compass, ExternalLink, Database
} from 'lucide-react';
import { EngineeringBrief, NearbyWellSummary, DepthRiskInterval, RegionalDrillingContext } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  CRITICAL: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
    icon: <XCircle className="w-4 h-4 text-red-600" />
  },
  HIGH: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-300',
    icon: <AlertTriangle className="w-4 h-4 text-orange-600" />
  },
  MEDIUM: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-900',
    border: 'border-yellow-300',
    icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />
  },
  LOW: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
  }
};

const CONFIDENCE_CONFIG: Record<string, { color: string; label: string }> = {
  HIGH:         { color: 'text-emerald-400', label: 'HIGH CONFIDENCE' },
  MODERATE:     { color: 'text-yellow-400',  label: 'MODERATE CONFIDENCE' },
  LOW:          { color: 'text-orange-400',  label: 'LOW CONFIDENCE' },
  INSUFFICIENT: { color: 'text-red-400',     label: 'INSUFFICIENT DATA' }
};

function ProvenanceBadge({ prov }: { prov: string }) {
  const colors: Record<string, string> = {
    DIRECT:            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    REGIONAL:          'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ANALOG:            'bg-purple-500/20 text-purple-300 border-purple-500/30',
    INFERENCE:         'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    PUBLIC:            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    SYNTHETIC:         'bg-purple-500/20 text-purple-300 border-purple-500/30',
    AUTHORIZED:        'bg-blue-500/20 text-blue-300 border-blue-500/30',
    DERIVED:           'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    RESEARCH_MANIFEST: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  };
  const cls = colors[prov] || 'bg-white/10 text-ink-muted border-[#88713C]/15';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${cls}`}>
      {prov}
    </span>
  );
}

// ── Section: Regional Drilling Context (RESEARCH_MANIFEST) ────────────────

function RegionalDrillingContextSection({ ctx }: { ctx?: RegionalDrillingContext }) {
  if (!ctx || !ctx.is_hydrocarbon_region) return null;

  return (
    <div className="bg-white border border-amber-500/30 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-5 py-4 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-ink">Regional Drilling Context & Basin Characterization</h3>
          <ProvenanceBadge prov="RESEARCH_MANIFEST" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-amber-300 font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/25">
            {ctx.basin_name}
          </span>
          <span className="text-[11px] text-ink-muted font-mono">
            {ctx.state_or_region}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Activity & Operational Signal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-white/[0.03] rounded-xl border border-[#88713C]/10 space-y-1">
            <div className="text-ink-muted uppercase text-[10px] font-semibold tracking-wider">Historical Activity</div>
            <div className="text-ink font-medium leading-relaxed">{ctx.historical_activity}</div>
          </div>
          <div className="p-3.5 bg-white/[0.03] rounded-xl border border-[#88713C]/10 space-y-1">
            <div className="text-ink-muted uppercase text-[10px] font-semibold tracking-wider">Recent Activity Signal</div>
            <div className="text-ink font-medium leading-relaxed">{ctx.recent_activity_signal}</div>
          </div>
        </div>

        {/* Evidenced Operators & Data Gap Status */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-[#88713C]/10 text-xs">
          {ctx.relevant_operators.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-ink-muted font-medium">Evidenced Operators:</span>
              <div className="flex gap-1.5 flex-wrap">
                {ctx.relevant_operators.map((op, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-blue-500/15 text-blue-300 rounded border border-blue-500/20 font-medium">
                    {op}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-ink-muted font-medium">Local NWIS Coverage:</span>
            <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
              ctx.data_gap_status === 'COMPLETE' ? 'bg-emerald-500/20 text-emerald-300' :
              ctx.data_gap_status === 'PARTIAL' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-amber-500/20 text-amber-300'
            }`}>
              {ctx.data_gap_status}
            </span>
          </div>
        </div>

        {/* Knowledge & Risk Themes */}
        {ctx.key_drilling_themes.length > 0 && (
          <div className="pt-3 border-t border-[#88713C]/10">
            <div className="text-ink-muted text-[11px] font-semibold uppercase tracking-wider mb-2">
              Documented Regional Drilling Knowledge & Hazard Themes
            </div>
            <div className="space-y-1.5">
              {ctx.key_drilling_themes.map((th, idx) => (
                <div key={idx} className="text-xs text-ink/80 flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{th}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source References */}
        {ctx.source_references.length > 0 && (
          <div className="pt-3 border-t border-[#88713C]/10 flex items-center gap-2 flex-wrap text-[11px] text-ink-muted">
            <span className="font-semibold text-ink-muted">Documented Sources & Regulatory Filings:</span>
            {ctx.source_references.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-amber-400/90 hover:text-amber-300 underline font-medium truncate max-w-xs"
              >
                <span>{url.split('/').pop() || 'Institutional Filing'}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section: Technical Analog Wells (When direct offset wells are absent) ──

function TechnicalAnalogWellsSection({ analogs }: { analogs?: any[] }) {
  if (!analogs || analogs.length === 0) return null;

  return (
    <div className="bg-white border border-purple-500/30 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-5 py-4 bg-gradient-to-r from-purple-500/10 to-transparent border-b border-purple-500/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-ink">Technical Analog Benchmark Wells</h3>
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
            {analogs.length} references
          </span>
        </div>
        <ProvenanceBadge prov="ANALOG" />
      </div>

      <div className="divide-y divide-[#88713C]/10">
        {analogs.map((w, i) => (
          <div key={i} className="px-5 py-4 hover:bg-cream-50 transition-colors">
            <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-ink text-sm font-bold">{w.well_name}</span>
                  <ProvenanceBadge prov="ANALOG" />
                </div>
                <div className="text-ink-muted text-xs mt-1">
                  {w.field} · TD {w.total_depth_md.toFixed(0)}m · {w.basin}
                </div>
                <div className="text-purple-300/90 text-xs mt-1.5 leading-relaxed bg-purple-500/10 p-2.5 rounded-lg border border-purple-500/15">
                  {w.operational_relevance}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="text-[10px] text-ink-muted uppercase font-semibold">Benchmark Match</div>
                <div className="text-xs px-2.5 py-1 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  {w.analog_relevance_score.toFixed(0)}/100
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section: Nearby Wells ─────────────────────────────────────────────────

function NearbyWellsSection({ wells }: { wells: NearbyWellSummary[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? wells : wells.slice(0, 4);

  return (
    <div className="bg-white border border-[#88713C]/15 rounded-[20px] overflow-hidden shadow-card text-ink">
      <div className="px-5 py-4 border-b border-[#88713C]/15 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-ink">Direct Offset Wells</h3>
          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">
            {wells.length} found
          </span>
        </div>
      </div>

      <div className="divide-y divide-[#88713C]/10">
        {shown.map((w) => (
          <div key={w.well_id} className="px-5 py-4 hover:bg-cream-50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-ink text-sm font-bold truncate">{w.well_name}</span>
                  <ProvenanceBadge prov={w.provenance} />
                  {w.is_synthetic && (
                    <span className="text-[10px] text-ink-muted italic">(synthetic)</span>
                  )}
                </div>
                <div className="text-ink-muted text-xs mt-1">{w.field} · TD {w.total_depth_md.toFixed(0)}m · {w.status}</div>
                {w.formations.length > 0 && (
                  <div className="text-ink-muted text-xs mt-1 truncate">
                    Formations: {w.formations.slice(0, 3).join(', ')}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="text-amber-300 font-bold text-sm">{w.distance_km.toFixed(1)} km</div>
                <div className="text-xs text-ink-muted">{w.azimuth_deg.toFixed(0)}° az</div>
                <div className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  w.relevance_score >= 70 ? 'bg-emerald-500/20 text-emerald-300' :
                  w.relevance_score >= 40 ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-white/10 text-ink-muted'
                }`}>
                  {w.relevance_score.toFixed(0)}/100
                </div>
              </div>
            </div>
            {w.event_count > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-300/90 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                {w.event_count} historical incident{w.event_count !== 1 ? 's' : ''} recorded
              </div>
            )}
          </div>
        ))}
      </div>

      {wells.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2.5 flex items-center justify-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors border-t border-[#88713C]/15"
        >
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {wells.length - 4} more</>}
        </button>
      )}
    </div>
  );
}

// ── Section: Depth Risk Profile ───────────────────────────────────────────

function DepthRiskSection({ intervals, plannedDepth }: { intervals: DepthRiskInterval[]; plannedDepth: number }) {
  return (
    <div className="bg-white border border-[#88713C]/15 rounded-[20px] overflow-hidden shadow-card text-ink">
      <div className="px-5 py-4 border-b border-[#88713C]/15 flex items-center gap-2">
        <Layers className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold text-ink">Depth-wise Formation & Risk Profile</h3>
        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
          ±600m of {plannedDepth.toFixed(0)}m TD
        </span>
      </div>

      {intervals.length === 0 ? (
        <div className="px-5 py-8 text-center text-ink-muted text-sm">
          No formation data available for this depth window from offset wells. Prognosis derived from regional stratigraphy.
        </div>
      ) : (
        <div className="divide-y divide-[#88713C]/10">
          {intervals.map((interval, i) => {
            const cfg = RISK_CONFIG[interval.risk_level] || RISK_CONFIG.LOW;
            return (
              <div key={i} className={`px-5 py-4 ${cfg.bg} border-l-4 ${cfg.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {cfg.icon}
                      <span className="text-ink text-sm font-bold">{interval.formation_name}</span>
                      <ProvenanceBadge prov={interval.provenance} />
                    </div>
                    <div className="text-ink-muted text-xs mt-1 font-medium">
                      {interval.depth_from.toFixed(0)}m – {interval.depth_to.toFixed(0)}m MD · {interval.lithology}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-ink-muted font-mono">
                      <span>Pore Pressure: <strong className="text-ink/80">{interval.pore_pressure_gradient.toFixed(3)} g/cc</strong></span>
                      <span>Fracture Gradient: <strong className="text-ink/80">{interval.fracture_gradient.toFixed(3)} g/cc</strong></span>
                    </div>
                    {interval.pressure_context && (
                      <div className="mt-1.5 text-xs text-ink-muted italic bg-black/20 p-2 rounded border border-[#88713C]/10">
                        {interval.pressure_context}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {interval.risk_level} SIGNAL
                    </span>
                    {interval.evidence_count > 0 && (
                      <span className="text-xs text-ink-muted">
                        {interval.evidence_count} event{interval.evidence_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Section: Critical Events ──────────────────────────────────────────────

function CriticalEventsSection({ events }: { events: any[] }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? events : events.slice(0, 5);

  if (events.length === 0) return null;

  return (
    <div className="bg-white border border-[#88713C]/15 rounded-[20px] overflow-hidden shadow-card text-ink">
      <div className="px-5 py-4 border-b border-[#88713C]/15 flex items-center gap-2">
        <Activity className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-bold text-ink">Historical Drilling Incidents (Nearby Offsets)</h3>
        <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/20">
          {events.length} HIGH/CRITICAL
        </span>
      </div>

      <div className="divide-y divide-[#88713C]/10">
        {shown.map((e, i) => {
          const cfg = RISK_CONFIG[e.severity] || RISK_CONFIG.LOW;
          return (
            <div key={i} className="px-5 py-4 hover:bg-cream-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-ink text-sm font-bold">{e.title}</span>
                      <div className="text-ink-muted text-xs mt-0.5">
                        {e.well_name} · {e.depth_start?.toFixed(0)}m – {e.depth_end?.toFixed(0)}m · {e.formation}
                      </div>
                    </div>
                    <ProvenanceBadge prov={e.provenance} />
                  </div>

                  <p className="text-ink/80 text-xs mt-2 leading-relaxed">{e.description}</p>

                  {e.cause && (
                    <div className="mt-2 text-xs">
                      <span className="text-red-400 font-semibold">Root Cause: </span>
                      <span className="text-ink-muted">{e.cause}</span>
                    </div>
                  )}
                  {e.mitigation && (
                    <div className="mt-1 text-xs">
                      <span className="text-emerald-400 font-semibold">Field Mitigation: </span>
                      <span className="text-ink-muted">{e.mitigation}</span>
                    </div>
                  )}

                  {e.distance_km != null && (
                    <div className="mt-2 text-xs text-ink-muted flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-amber-400" />
                      Recorded at offset well {e.distance_km.toFixed(1)} km away
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {events.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2.5 flex items-center justify-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors border-t border-[#88713C]/15"
        >
          {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {events.length - 5} more incidents</>}
        </button>
      )}
    </div>
  );
}

// ── Section: Full Document Evidence Repository ───────────────────────────

function DocumentEvidenceSection({ evidence }: { evidence: any[] }) {
  const [open, setOpen] = useState(false);

  if (evidence.length === 0) return null;

  return (
    <div className="bg-white border border-[#88713C]/15 rounded-[20px] overflow-hidden shadow-card text-ink">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-bold text-ink">Full Document Evidence Library & Citations</h3>
          <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/20">
            {evidence.length} indexed records
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-ink-muted" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
      </button>

      {open && (
        <div className="divide-y divide-[#88713C]/10 border-t border-[#88713C]/15">
          {evidence.map((e, i) => (
            <div key={i} className="px-5 py-4 hover:bg-cream-50 transition-colors">
              <div className="flex items-start gap-2 mb-2">
                <FileText className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-ink text-xs font-semibold">{e.document_title || e.document_id}</span>
                    {e.page_number && <span className="text-ink-muted text-xs">p.{e.page_number}</span>}
                    <ProvenanceBadge prov={e.provenance || 'ANALOG'} />
                  </div>
                  {e.formation && (
                    <div className="text-ink-muted text-xs mt-0.5">{e.formation}</div>
                  )}
                </div>
                {e.source_url && (
                  <a
                    href={e.source_url.split(';')[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-300 underline flex items-center gap-1 shrink-0"
                  >
                    View Source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-ink-muted text-xs leading-relaxed pl-6 italic border-l-2 border-pink-500/20 my-1">
                "{e.snippet}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main: Engineering Brief Page ──────────────────────────────────────────

export const EngineeringBriefPage: React.FC = () => {
  const navigate = useNavigate();
  const [brief, setBrief] = useState<EngineeringBrief | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('nwis_engineering_brief');
    if (!raw) {
      navigate('/plan');
      return;
    }
    try {
      setBrief(JSON.parse(raw));
    } catch {
      navigate('/plan');
    }
  }, [navigate]);

  if (!brief) {
    return (
      <div className="flex items-center justify-center h-full text-ink-muted text-sm">
        Loading Engineering Brief...
      </div>
    );
  }

  const confCfg = CONFIDENCE_CONFIG[brief.data_confidence] || CONFIDENCE_CONFIG.LOW;
  const hasCritical = brief.depth_risk_profile.some(i => i.risk_level === 'CRITICAL');
  const hasHigh = brief.depth_risk_profile.some(i => i.risk_level === 'HIGH');
  const overallRisk = hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : brief.depth_risk_profile.some(i => i.risk_level === 'MEDIUM') ? 'MEDIUM' : 'LOW';
  const overallCfg = RISK_CONFIG[overallRisk] || RISK_CONFIG.LOW;

  const isNoDirectWells = brief.nearby_wells.length === 0;

  return (
    <div className="w-full min-h-full py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">

      {/* ── Top Action Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/plan')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream-50 hover:bg-white/10 text-ink-muted hover:text-ink text-xs font-semibold transition-all border border-[#88713C]/15"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Map
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cream-50 hover:bg-cream-100 border border-[#88713C]/30 rounded-xl text-brand-brown text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          Export Brief
        </button>
      </div>

      {/* ── Brief Header Card ───────────────────────────────────────────── */}
      <div className="bg-white border border-[#88713C]/15 rounded-[20px] p-6 shadow-card text-ink">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400/90 text-xs font-mono uppercase tracking-widest font-bold">
                ENGINEERING BRIEF
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              {brief.location_name || `${brief.location_lat.toFixed(4)}°N, ${brief.location_lng.toFixed(4)}°E`}
            </h1>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-ink-muted flex-wrap pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                {brief.location_lat.toFixed(5)}, {brief.location_lng.toFixed(5)}
              </span>
              <span className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-blue-400" />
                Planned TD: <strong className="text-ink">{brief.planned_depth_m.toFixed(0)}m MD</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                {brief.total_wells_analyzed} direct offset well{brief.total_wells_analyzed !== 1 ? 's' : ''} · {brief.radius_used_km.toFixed(0)} km radius
              </span>
            </div>
          </div>

          {/* Risk + Confidence Badges */}
          <div className="flex flex-col gap-2 items-end">
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border ${overallCfg.bg} ${overallCfg.border}`}>
              {overallCfg.icon}
              <span className={`text-xs sm:text-sm font-bold ${overallCfg.text}`}>
                {overallRisk} RISK AREA
              </span>
            </div>
            <div className={`text-xs font-bold px-3 py-1 rounded-lg ${confCfg.color} bg-cream-50 border border-[#88713C]/15`}>
              {confCfg.label}
            </div>
          </div>
        </div>
      </div>

      {/* ── Area Intelligence & Operational Summary + Attached Supporting Evidence ── */}
      <div className="bg-white border border-[#88713C]/15 rounded-[20px] p-6 shadow-card space-y-5 text-ink">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-ink tracking-wide">
              Area Intelligence & Operational Summary
            </h2>
          </div>
          <p className="text-ink text-sm sm:text-base leading-relaxed">
            {brief.area_risk_summary}
          </p>
        </div>

        {/* Geological & Stratigraphic Context */}
        <div className="border-t border-[#88713C]/15 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Geological & Stratigraphic Context
            </span>
          </div>
          <p className="text-ink-muted text-xs sm:text-sm leading-relaxed">
            {brief.geological_context}
          </p>
        </div>

        {/* ── Supporting Documents & Regulatory Evidence (DIRECTLY UNDER SUMMARY) ── */}
        {brief.document_evidence && brief.document_evidence.length > 0 && (
          <div className="border-t border-[#88713C]/15 pt-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Supporting Documents & Reference Evidence ({brief.document_evidence.length} Records)
                </span>
              </div>
              <span className="text-[11px] text-ink-muted">
                Primary documentation backing this prognosis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {brief.document_evidence.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white/[0.03] hover:bg-white/[0.06] transition-all rounded-xl border border-[#88713C]/15 flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-ink">
                        <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{doc.document_title || doc.document_id}</span>
                      </div>
                      <ProvenanceBadge prov={doc.provenance || 'ANALOG'} />
                    </div>
                    {doc.snippet && (
                      <p className="text-ink/75 text-xs italic leading-relaxed line-clamp-3">
                        "{doc.snippet}"
                      </p>
                    )}
                  </div>
                  <div className="pt-2 border-t border-[#88713C]/10 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>
                      {doc.source_type === 'WELL_DOCUMENT'
                        ? `Well ${doc.well_id} · p.${doc.page_number}`
                        : `${doc.area_name || doc.basin || 'National Filing'}`}
                    </span>
                    {doc.source_url ? (
                      <a
                        href={doc.source_url.split(';')[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                      >
                        View Source <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="font-mono text-emerald-400/80 font-medium">Indexed Doc</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Regional Drilling Context (RESEARCH_MANIFEST) ──────────────── */}
      <RegionalDrillingContextSection ctx={brief.regional_drilling_context} />

      {/* ── Direct Offset Wells (If any exist) ─────────────────────────── */}
      {brief.nearby_wells.length > 0 && (
        <NearbyWellsSection wells={brief.nearby_wells} />
      )}

      {/* ── Technical Analog Wells (If direct wells are absent) ────────── */}
      {isNoDirectWells && brief.analog_wells && brief.analog_wells.length > 0 && (
        <TechnicalAnalogWellsSection analogs={brief.analog_wells} />
      )}

      {/* ── Depth-wise Formation & Risk Profile ────────────────────────── */}
      <DepthRiskSection intervals={brief.depth_risk_profile} plannedDepth={brief.planned_depth_m} />

      {/* ── Critical Events ────────────────────────────────────────────── */}
      <CriticalEventsSection events={brief.critical_events} />

      {/* ── Full Document Evidence Library & Citations ─────────────────── */}
      <DocumentEvidenceSection evidence={brief.document_evidence} />

      {/* ── Provenance & Data Lineage ──────────────────────────────────── */}
      <div className="bg-white border border-[#88713C]/15 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-ink-muted" />
          <h3 className="text-sm font-bold text-ink-muted">Data Provenance & Lineage</h3>
        </div>
        <p className="text-ink-muted text-xs leading-relaxed">{brief.provenance_notes}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {(['DIRECT', 'REGIONAL', 'ANALOG', 'INFERENCE', 'RESEARCH_MANIFEST'] as const).map(t => (
            <ProvenanceBadge key={t} prov={t} />
          ))}
        </div>
        <p className="mt-2 text-ink-muted text-xs">
          DIRECT = offset well records · REGIONAL = basin-level geological framework ·
          ANALOG = deep benchmark wells · INFERENCE = extrapolated reasoning · RESEARCH_MANIFEST = DGH/MoPNG official survey
        </p>
      </div>

      {/* NWIS Disclaimer if INSUFFICIENT_DATA */}
      {brief.analysis_status === 'INSUFFICIENT_DATA' && (
        <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
          <div className="flex items-center gap-2 mb-1 font-bold">
            <XCircle className="w-4 h-4" />
            Insufficient Data Advisory
          </div>
          <p className="text-red-300/70 text-xs leading-relaxed">
            No nearby offset wells or regional petroleum basin analogs found for this location.
            This engineering brief cannot provide geological context or risk assessment for the selected location.
          </p>
        </div>
      )}
    </div>
  );
};

export default EngineeringBriefPage;
