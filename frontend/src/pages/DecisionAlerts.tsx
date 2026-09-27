import React, { useEffect, useState } from 'react';
import {
  Bell, AlertTriangle, ShieldCheck, CheckCircle2,
  FileText, ExternalLink, Filter, Search, UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { AlertItem } from '../types';
import { Badge } from '../components/ui/Badge';
import { useAppStore } from '../store/useAppStore';

export const DecisionAlerts: React.FC = () => {
  const { openAlertDrawer, openDocumentViewer } = useAppStore();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    setLoading(true);
    api.getAlerts().then((data) => {
      setAlerts(data);
      setLoading(false);
    });
  };

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink flex items-center gap-2">
            <span>Engineering Decision-Support Alerts</span>
            <Badge variant="severity" severity="HIGH">
              {alerts.filter(a => a.status === 'OPEN').length} Active
            </Badge>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Explainable drilling hazard alerts grounded in real-time sensor anomalies, ML predictions, and offset historical precedents.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-[#88713C]/20 shadow-sm text-xs">
          <Filter className="w-4 h-4 text-ink-muted" />
          <span className="font-bold text-ink">Status:</span>
          {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === st
                  ? 'bg-ink text-white'
                  : 'bg-cream-50 text-ink hover:bg-cream-200/50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="card-surface p-12 text-center text-xs text-ink-muted">
            No alerts found matching filter criteria.
          </div>
        ) : (
          filteredAlerts.map((alt) => {
            const isOpen = alt.status === 'OPEN';

            return (
              <div
                key={alt.alert_id}
                className={`card-surface p-6 transition-all border-l-4 ${
                  isOpen ? 'border-l-red-600 bg-[#FFFDF9]' : 'border-l-emerald-600 bg-white'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="severity" severity={alt.severity}>
                      {alt.severity} RISK
                    </Badge>
                    <span className="font-mono text-sm font-bold text-ink">{alt.alert_id}</span>
                    <span className="text-xs text-ink-muted">
                      Well: <strong className="text-ink">{alt.well_id}</strong>
                    </span>
                    <span className="text-xs text-ink-muted">
                      Depth: <strong className="text-ink font-mono">{alt.depth.toFixed(1)}m</strong>
                    </span>
                    <span className="text-xs text-ink-muted">
                      Formation: <strong className="text-brand-brown">{alt.formation}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-muted">
                      Probability: <strong className="text-red-700 font-mono">{(alt.probability * 100).toFixed(0)}%</strong>
                    </span>
                    <span className="text-[10px] font-mono bg-cream-50 border px-2 py-0.5 rounded text-gray-700">
                      {alt.model_version}
                    </span>
                  </div>
                </div>

                {/* Main Alert Rationale & Contributing Features */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4">
                  {/* Detection Reason (7 Cols) */}
                  <div className="lg:col-span-7 space-y-3 text-xs">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-ink-muted text-[11px] block mb-1">
                        Anomaly Reason (Why It Fired)
                      </span>
                      <p className="text-ink bg-cream-50/80 p-3 rounded-xl border border-cream-200 leading-relaxed">
                        {alt.reason}
                      </p>
                    </div>

                    {/* Historical Precedent */}
                    <div>
                      <span className="font-bold uppercase tracking-wider text-ink-muted text-[11px] block mb-1">
                        Correlated Offset Incident
                      </span>
                      <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between font-bold text-red-950">
                          <span>NWIS-ASSAM-001 (Offset)</span>
                          <span className="font-mono text-[11px]">Depth: 3268m • Tipam Sandstone</span>
                        </div>
                        <p className="text-gray-700">
                          Differential sticking observed during survey connection following identical torque escalation pattern.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Audit & Action (5 Cols) */}
                  <div className="lg:col-span-5 bg-[#FAF4E6] p-4 rounded-xl border border-[#88713C]/20 flex flex-col justify-between text-xs space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink-muted text-[11px] uppercase">Alert Status:</span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          isOpen ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {alt.status}
                        </span>
                      </div>

                      {alt.acknowledged_by ? (
                        <div className="space-y-1 pt-1 border-t border-gray-200 text-[11px]">
                          <div className="text-ink font-semibold flex items-center gap-1 text-emerald-800">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Acknowledged by {alt.acknowledged_by}</span>
                          </div>
                          <div className="text-ink-muted">
                            Time: {new Date(alt.acknowledged_at || '').toLocaleString()}
                          </div>
                          {alt.resolution_notes && (
                            <div className="text-gray-700 italic bg-white p-2 rounded border">
                              "{alt.resolution_notes}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-ink-muted text-[11px]">
                          Drilling engineer review required. Acknowledging logs an immutable audit trail.
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => openDocumentViewer('DDR-0032', 14)}
                        className="text-xs font-bold text-brand-brown hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Inspect Source DDR</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      {isOpen && (
                        <button
                          onClick={() => openAlertDrawer(alt)}
                          className="px-4 py-2 bg-ink hover:bg-ink-light text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#F5D867]" />
                          <span>Acknowledge</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
