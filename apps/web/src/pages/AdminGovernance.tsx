import React, { useEffect, useState } from 'react';
import {
  Sliders, Users, Database, Shield, Activity,
  Cpu, FileCheck, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { DataSource, ModelMetadata, User } from '../types';
import { Badge } from '../components/ui/Badge';

export const AdminGovernance: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getDataSources(),
      api.getModels(),
      api.getHealth(),
      fetch('http://localhost:8000/api/admin/audit-logs').then(r => r.json()).catch(() => [])
    ]).then(([ds, m, h, al]) => {
      setDataSources(ds);
      setModels(m);
      setHealth(h);
      setAuditLogs(al);
      setLoading(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink flex items-center gap-2">
            <span>Administration & Institutional Governance</span>
            <Badge category="ops">eRTMAC-NWIS</Badge>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Data provenance tracking, role-based access control, machine learning model registry, and immutable audit logs.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-white text-ink border border-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Subsystem Health Cards Row */}
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(health.subsystems || {}).map(([key, sub]: [string, any]) => (
            <div key={key} className="card-surface p-3.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink uppercase text-[10px] tracking-wider">{key}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-emerald-700 font-bold text-xs">{sub.status}</div>
              <div className="text-[10px] text-ink-muted truncate">
                {sub.dialect || sub.engine || sub.ocr_engine || 'Active'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Sources & Provenance Dashboard (PRD Requirement) */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-brown" />
              <span>Data Sources & Provenance Governance</span>
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Strict separation between Public, Authorized, Synthetic, and Derived data assets.
            </p>
          </div>
          <Badge variant="provenance" provenance="SYNTHETIC" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataSources.map((ds) => (
            <div key={ds.id} className="p-4 bg-cream-50 rounded-xl border border-cream-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-sm">{ds.name}</span>
                <Badge variant="provenance" provenance={ds.provenance} />
              </div>

              <p className="text-ink-muted leading-relaxed">{ds.description}</p>

              <div className="pt-2 border-t border-gray-200 flex items-center justify-between font-mono text-[11px]">
                <span>Type: <strong>{ds.source_type}</strong></span>
                <span>Records: <strong>{ds.record_count.toLocaleString()}</strong></span>
                <span className="text-emerald-700 font-bold">{ds.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-brown" />
              <span>Immutable Engineering Audit Trail</span>
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Captures all engineer alert acknowledgements, document ingestions, and AI inquiries.
            </p>
          </div>
          <Badge category="ops">{auditLogs.length} Logged Actions</Badge>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <div className="p-4 text-center text-xs text-ink-muted">No audit events recorded yet.</div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-cream-50 rounded-xl border border-cream-200 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] bg-black/5 px-2 py-0.5 rounded text-gray-700">
                    {log.action}
                  </span>
                  <span className="font-bold text-ink">{log.username || 'driller_piter'}</span>
                  <span className="text-ink-muted">
                    Entity: <strong>{log.entity_type} ({log.entity_id})</strong>
                  </span>
                </div>
                <span className="font-mono text-[11px] text-gray-500">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
