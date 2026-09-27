import React, { useEffect, useState } from 'react';
import {
  Sliders, Users, Database, Shield, Activity,
  Cpu, FileCheck, CheckCircle2, AlertCircle, RefreshCw,
  Globe2, MapPin, Layers, Compass, Search, Filter,
  ArrowUpRight, AlertTriangle, Sparkles, BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { DataSource, ModelMetadata, User, NationalCoverageSummary, ResearchArea, ResearchRefreshReport } from '../types';
import { Badge } from '../components/ui/Badge';

export const AdminGovernance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'governance' | 'national_coverage'>('governance');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // National Coverage & Acquisition Roadmap State
  const [coverageSummary, setCoverageSummary] = useState<NationalCoverageSummary | null>(null);
  const [researchAreas, setResearchAreas] = useState<ResearchArea[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBasin, setSelectedBasin] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [refreshReport, setRefreshReport] = useState<ResearchRefreshReport | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      api.getAuditLogs().catch(() => []),
      api.getResearchCoverage().catch(() => null),
      api.getResearchAreas().catch(() => [])
    ]).then(([ds, m, h, al, cov, areas]) => {
      setDataSources(ds);
      setModels(m);
      setHealth(h);
      setAuditLogs(al);
      if (cov) setCoverageSummary(cov);
      if (areas) setResearchAreas(areas);
      setLoading(false);
    });
  };

  const handleRefreshResearchIndex = async () => {
    setIsRefreshing(true);
    try {
      const report = await api.refreshResearchIndex();
      setRefreshReport(report);
      // Reload coverage and areas
      const [cov, areas] = await Promise.all([
        api.getResearchCoverage(),
        api.getResearchAreas()
      ]);
      setCoverageSummary(cov);
      setResearchAreas(areas);
    } catch (err: any) {
      alert(`Failed to refresh research index: ${err.message || err}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter research areas for roadmap table
  const filteredAreas = researchAreas.filter((a) => {
    const name = a.area_name || a.name || '';
    const state = a.state_or_region || a.state || '';
    const basin = a.basin || '';
    const id = a.area_id || (a.id ? String(a.id) : '');
    const q = searchQuery.toLowerCase();

    const matchesSearch = !searchQuery || 
      name.toLowerCase().includes(q) ||
      state.toLowerCase().includes(q) ||
      basin.toLowerCase().includes(q) ||
      id.toLowerCase().includes(q);

    const matchesBasin = selectedBasin === 'ALL' || a.basin === selectedBasin;
    const matchesPriority = selectedPriority === 'ALL' || a.nwis_data_priority === selectedPriority;
    const matchesTier = selectedTier === 'ALL' || a.activity_tier === selectedTier;
    return matchesSearch && matchesBasin && matchesPriority && matchesTier;
  });

  const uniqueBasins = Array.from(new Set(researchAreas.map(a => a.basin))).sort();

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
            Data provenance tracking, India-wide coverage roadmap, machine learning registry, and immutable audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'national_coverage' && (
            <button
              onClick={handleRefreshResearchIndex}
              disabled={isRefreshing}
              className="px-4 py-2 bg-brand-brown text-white rounded-xl text-xs font-bold hover:bg-brand-brown/90 flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Re-scanning Manifest...' : 'Refresh Research Index'}</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="px-4 py-2 bg-white text-ink border border-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Metrics</span>
          </button>
        </div>
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('governance')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'governance'
              ? 'border-brand-brown text-brand-brown'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>System & Provenance Governance</span>
        </button>

        <button
          onClick={() => setActiveTab('national_coverage')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'national_coverage'
              ? 'border-brand-brown text-brand-brown'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>National Coverage & Data Acquisition Roadmap</span>
          {coverageSummary && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {coverageSummary.total_areas} Areas
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: SYSTEM & PROVENANCE GOVERNANCE */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
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
                  Strict separation between Public, Authorized, Synthetic, Derived, and Research Manifest data assets.
                </p>
              </div>
              <Badge variant="provenance" provenance="RESEARCH_MANIFEST" />
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
                  Captures all engineer alert acknowledgements, research index synchronizations, and RAG inquiries.
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
      )}

      {/* TAB 2: NATIONAL DATA COVERAGE & ACQUISITION ROADMAP */}
      {activeTab === 'national_coverage' && (
        <div className="space-y-6">
          {/* Refresh Report Notification Banner */}
          {refreshReport && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Research Manifest Index Synchronized Successfully</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-600">{refreshReport.timestamp}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[11px] text-emerald-900 pt-1">
                <div>Canonical: <strong>{refreshReport.canonical_format}</strong></div>
                <div>Evaluated: <strong>{refreshReport.total_records} records</strong></div>
                <div>Added: <strong>{refreshReport.added}</strong></div>
                <div>Updated: <strong>{refreshReport.updated}</strong></div>
                <div>Unchanged: <strong>{refreshReport.unchanged}</strong></div>
                <div>Discrepancies: <strong>{refreshReport.discrepancies.length}</strong></div>
              </div>
            </div>
          )}

          {/* National Overview KPI Cards */}
          {coverageSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="card-surface p-4 text-xs space-y-1">
                <div className="text-ink-muted text-[10px] uppercase font-bold tracking-wider">Research Areas</div>
                <div className="text-2xl font-black text-ink">{coverageSummary.total_areas}</div>
                <div className="text-[10px] text-emerald-700 font-medium">100% Normalized</div>
              </div>

              <div className="card-surface p-4 text-xs space-y-1">
                <div className="text-ink-muted text-[10px] uppercase font-bold tracking-wider">States & UTs</div>
                <div className="text-2xl font-black text-ink">{coverageSummary.total_states}</div>
                <div className="text-[10px] text-ink-muted">Nationwide Coverage</div>
              </div>

              <div className="card-surface p-4 text-xs space-y-1">
                <div className="text-ink-muted text-[10px] uppercase font-bold tracking-wider">Sedimentary Basins</div>
                <div className="text-2xl font-black text-ink">{coverageSummary.total_basins}</div>
                <div className="text-[10px] text-ink-muted">Cat I to IV Basins</div>
              </div>

              <div className="card-surface p-4 text-xs space-y-1">
                <div className="text-ink-muted text-[10px] uppercase font-bold tracking-wider">Acquisition Priority</div>
                <div className="text-2xl font-black text-rose-700">
                  {coverageSummary.priority_breakdown?.VERY_HIGH || 0} Critical
                </div>
                <div className="text-[10px] text-ink-muted">
                  {coverageSummary.priority_breakdown?.HIGH || 0} High / {coverageSummary.priority_breakdown?.MEDIUM || 0} Med
                </div>
              </div>

              <div className="card-surface p-4 text-xs space-y-1">
                <div className="text-ink-muted text-[10px] uppercase font-bold tracking-wider">Activity Tiers</div>
                <div className="text-2xl font-black text-amber-700">
                  {coverageSummary.activity_tier_breakdown?.HIGH || 0} High
                </div>
                <div className="text-[10px] text-ink-muted">
                  {coverageSummary.activity_tier_breakdown?.MODERATE || 0} Moderate / {coverageSummary.activity_tier_breakdown?.FRONTIER || 0} Frontier
                </div>
              </div>

              <div className="card-surface p-4 text-xs space-y-1">
                <div className="text-ink-muted text-[10px] uppercase font-bold tracking-wider">Manifest Version</div>
                <div className="text-sm font-black text-ink font-mono mt-1">{coverageSummary.snapshot_version}</div>
                <div className="text-[10px] text-ink-muted truncate" title={coverageSummary.canonical_source_file}>
                  Canonical: CSV
                </div>
              </div>
            </div>
          )}

          {/* Acquisition Roadmap Filter & Table */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-brown" />
                  <span>National Data Acquisition Roadmap (Next Target Ingestions)</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Identifies geographical drilling areas documented in the research manifest, evaluates NWIS coverage gaps, and guides next well record acquisitions.
                </p>
              </div>

              <span className="text-xs font-bold text-ink-muted">
                Showing {filteredAreas.length} of {researchAreas.length} Areas
              </span>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-cream-50 p-3 rounded-xl border border-cream-200 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Area, State, Basin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-brown font-medium"
                />
              </div>

              <div>
                <select
                  value={selectedBasin}
                  onChange={(e) => setSelectedBasin(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-brown"
                >
                  <option value="ALL">All Basins ({uniqueBasins.length})</option>
                  {uniqueBasins.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-brown"
                >
                  <option value="ALL">All Data Priorities</option>
                  <option value="VERY_HIGH">VERY_HIGH Priority</option>
                  <option value="HIGH">HIGH Priority</option>
                  <option value="MEDIUM">MEDIUM Priority</option>
                  <option value="LOW">LOW Priority</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-brown"
                >
                  <option value="ALL">All Activity Tiers</option>
                  <option value="HIGH">HIGH Activity</option>
                  <option value="MODERATE">MODERATE Activity</option>
                  <option value="DEVELOPMENT">DEVELOPMENT</option>
                  <option value="EXPLORATION">EXPLORATION</option>
                  <option value="FRONTIER">FRONTIER</option>
                  <option value="CBM">CBM</option>
                </select>
              </div>
            </div>

            {/* Roadmap Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-ink uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Area ID & Name</th>
                    <th className="p-3">Basin & Province</th>
                    <th className="p-3">State / Region</th>
                    <th className="p-3">Activity Tier</th>
                    <th className="p-3">NWIS Well Coverage</th>
                    <th className="p-3">Data Priority</th>
                    <th className="p-3">Operators</th>
                    <th className="p-3">Acquisition Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredAreas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-ink-muted">
                        No research areas match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAreas.map((a) => (
                      <tr key={a.area_id || a.id} className="hover:bg-cream-50 transition-colors">
                        <td className="p-3 font-medium">
                          <div className="font-bold text-ink">{a.area_name || a.name}</div>
                          <div className="font-mono text-[10px] text-gray-500">{a.area_id || a.id}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-ink">{a.basin}</div>
                          <div className="text-[10px] text-ink-muted">{a.geological_province || a.environment}</div>
                        </td>
                        <td className="p-3 text-ink-muted">
                          {a.state_or_region || a.state}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            a.activity_tier === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                            a.activity_tier === 'MODERATE' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {a.activity_tier}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            a.nwis_well_coverage === 'COMPLETE' ? 'bg-emerald-100 text-emerald-800' :
                            a.nwis_well_coverage === 'PARTIAL' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {a.nwis_well_coverage || 'RESEARCH_ONLY'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.nwis_data_priority === 'VERY_HIGH' ? 'bg-rose-600 text-white' :
                            a.nwis_data_priority === 'HIGH' ? 'bg-amber-500 text-white' :
                            a.nwis_data_priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {a.nwis_data_priority}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-ink-muted max-w-xs truncate" title={a.operators_evidenced || a.operator_signals}>
                          {a.operators_evidenced || a.operator_signals}
                        </td>
                        <td className="p-3 text-[11px] text-ink-muted max-w-sm">
                          <div className="font-medium text-ink truncate" title={a.recommended_ingestion_notes || ''}>
                            {a.recommended_ingestion_notes || 'Pending public DGH well release'}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            Gap: {a.missing_data_types?.join(', ') || 'Wells, Docs, Logs'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

