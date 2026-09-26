import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Compass, MapPin, Layers, FileText, Activity, AlertTriangle,
  Calendar, Ruler, ShieldAlert, ArrowLeft, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { Well, FormationInterval, TrajectoryPoint, EventItem, DocumentItem } from '../types';
import { Badge } from '../components/ui/Badge';
import { useAppStore } from '../store/useAppStore';

export const WellIntelligence: React.FC = () => {
  const { wellId } = useParams<{ wellId: string }>();
  const { openDocumentViewer, setActiveWellId, activeWellId } = useAppStore();
  
  const currentWellId = wellId || 'NWIS-ASSAM-003';
  const [well, setWell] = useState<Well | null>(null);
  const [formations, setFormations] = useState<FormationInterval[]>([]);
  const [trajectories, setTrajectories] = useState<TrajectoryPoint[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'trajectory' | 'formations' | 'events' | 'documents'>('overview');

  useEffect(() => {
    Promise.all([
      api.getWell(currentWellId),
      api.getWellFormations(currentWellId),
      api.getWellTrajectory(currentWellId),
      api.getWellEvents(currentWellId),
      api.getWellDocuments(currentWellId)
    ]).then(([w, f, t, e, d]) => {
      setWell(w);
      setFormations(f);
      setTrajectories(t);
      setEvents(e);
      setDocuments(d);
    });
  }, [currentWellId]);

  if (!well) {
    return <div className="p-8 text-center text-ink-muted">Loading well intelligence profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <Link to="/wells" className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Well Explorer</span>
        </Link>

        <div className="flex items-center gap-2">
          {activeWellId !== well.well_id && (
            <button
              onClick={() => setActiveWellId(well.well_id)}
              className="px-3 py-1.5 bg-brand-brown hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Set as Active Well
            </button>
          )}
          <Link
            to={`/map?focus=${well.well_id}`}
            className="px-3 py-1.5 bg-white text-ink border border-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map</span>
          </Link>
          <Link
            to={`/correlation?offset=${well.well_id}`}
            className="px-3 py-1.5 bg-white text-ink border border-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Correlate</span>
          </Link>
        </div>
      </div>

      {/* Well Intelligence Hero Card */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-black text-ink">{well.well_id}</span>
              <Badge variant="provenance" provenance={well.provenance} />
              <Badge variant="status">{well.status}</Badge>
            </div>
            <h2 className="text-2xl font-extrabold text-ink mt-1">{well.well_name}</h2>
            <div className="text-xs text-ink-muted mt-0.5">
              {well.field} Field • {well.block} • {well.basin} Basin
            </div>
          </div>

          {/* Sticky Current Depth / Exploration State */}
          <div className="bg-[#FAF2DF] border border-[#88713C]/25 rounded-2xl p-4 flex items-center gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">Current Depth</span>
              <span className="text-2xl font-black text-ink font-mono">{well.current_depth.toFixed(1)}m</span>
            </div>
            <div className="h-8 w-px bg-[#88713C]/20" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">Formation</span>
              <span className="text-sm font-bold text-brand-brown">{well.current_formation}</span>
            </div>
            <div className="h-8 w-px bg-[#88713C]/20" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">Total Depth</span>
              <span className="text-base font-bold text-ink font-mono">{well.total_depth_md.toFixed(0)}m</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 pt-1">
          {[
            { id: 'overview', label: 'Well Overview' },
            { id: 'trajectory', label: `Directional Survey (${trajectories.length})` },
            { id: 'formations', label: `Formations & Stratigraphy (${formations.length})` },
            { id: 'events', label: `Historical Events (${events.length})` },
            { id: 'documents', label: `Documents & Reports (${documents.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? 'border-brand-brown text-ink bg-white shadow-sm'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 text-xs space-y-2">
              <span className="font-bold text-ink uppercase text-[11px] block">Geospatial Coordinates</span>
              <div>Surface Latitude: <strong>{well.surface_latitude.toFixed(5)}° N</strong></div>
              <div>Surface Longitude: <strong>{well.surface_longitude.toFixed(5)}° E</strong></div>
              <div>Elevation (KB): <strong>{well.elevation_kb} meters</strong></div>
            </div>

            <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 text-xs space-y-2">
              <span className="font-bold text-ink uppercase text-[11px] block">Operational Lifecycle</span>
              <div>Spud Date: <strong>{well.spud_date || '2024-05-14'}</strong></div>
              <div>Well Status: <strong>{well.status}</strong></div>
              <div>Data Source: <strong>{well.data_source}</strong></div>
            </div>

            <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 text-xs space-y-2">
              <span className="font-bold text-ink uppercase text-[11px] block">Downhole Target</span>
              <div>Total Measured Depth: <strong>{well.total_depth_md} m</strong></div>
              <div>Total Vertical Depth: <strong>{well.total_depth_tvd || well.total_depth_md * 0.94} m</strong></div>
              <div>Target Lithology: <strong>Tipam / Barail Sandstone</strong></div>
            </div>
          </div>
        )}

        {activeTab === 'formations' && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-6 gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider px-3">
              <span>Formation</span>
              <span>Top MD</span>
              <span>Bottom MD</span>
              <span>Lithology</span>
              <span>Pore Press. (SG)</span>
              <span>Fracture (SG)</span>
            </div>

            {formations.map((f) => (
              <div key={f.id} className="grid grid-cols-6 gap-2 p-3 bg-cream-50 rounded-xl border border-cream-200 text-xs items-center">
                <span className="font-bold text-ink">{f.formation_name}</span>
                <span className="font-mono">{f.top_md} m</span>
                <span className="font-mono">{f.bottom_md} m</span>
                <span>{f.lithology}</span>
                <span className="font-mono text-emerald-800 font-semibold">{f.pore_pressure_gradient}</span>
                <span className="font-mono text-amber-800 font-semibold">{f.fracture_gradient}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'trajectory' && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-7 gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider px-3">
              <span>MD (m)</span>
              <span>TVD (m)</span>
              <span>Inclination (°)</span>
              <span>Azimuth (°)</span>
              <span>Dogleg (deg/30m)</span>
              <span>Northing (m)</span>
              <span>Easting (m)</span>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-1.5">
              {trajectories.map((t, idx) => (
                <div key={idx} className="grid grid-cols-7 gap-2 p-2.5 bg-cream-50 rounded-lg text-xs font-mono items-center">
                  <span className="font-bold">{t.md}</span>
                  <span>{t.tvd}</span>
                  <span>{t.inclination.toFixed(1)}°</span>
                  <span>{t.azimuth.toFixed(1)}°</span>
                  <span>{t.dogleg_severity.toFixed(2)}</span>
                  <span>{t.northing.toFixed(1)}</span>
                  <span>{t.easting.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-3 pt-2">
            {events.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-muted">
                No major NPT or problem events recorded for this well.
              </div>
            ) : (
              events.map((ev) => (
                <div key={ev.event_id} className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-950 text-sm">{ev.title}</span>
                    <Badge variant="severity" severity={ev.severity}>{ev.severity}</Badge>
                  </div>
                  <div className="text-[11px] text-red-900 font-semibold">
                    Depth: {ev.depth_start}m - {ev.depth_end}m • Formation: {ev.formation}
                  </div>
                  <p className="text-gray-800">{ev.description}</p>
                  {ev.cause && <div className="text-gray-700"><strong>Root Cause:</strong> {ev.cause}</div>}
                  {ev.mitigation && <div className="text-gray-700"><strong>Mitigation:</strong> {ev.mitigation}</div>}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => openDocumentViewer(ev.source_document || 'DDR-0032', ev.source_page)}
                      className="font-bold text-brand-brown hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Source: {ev.source_document} (Page {ev.source_page})</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                onClick={() => openDocumentViewer(doc.document_id, 1)}
                className="p-4 bg-cream-50 hover:bg-cream-200/50 border border-cream-200 rounded-xl cursor-pointer transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">{doc.document_id}</span>
                  <Badge category="research">{doc.document_type}</Badge>
                </div>
                <div className="font-semibold text-ink">{doc.title}</div>
                <div className="text-ink-muted text-[11px] flex justify-between">
                  <span>Pages: {doc.page_count}</span>
                  <span>Date: {doc.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
