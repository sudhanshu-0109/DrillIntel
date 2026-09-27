import React, { useEffect, useState } from 'react';
import {
  FolderTree, Search, Filter, MapPin, Layers, FileText,
  Activity, ArrowRight, Eye, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { Well } from '../types';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

export const WellExplorer: React.FC = () => {
  const { setActiveWellId, activeWellId } = useAppStore();
  const [wells, setWells] = useState<Well[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWells().then((data) => {
      setWells(data);
      setLoading(false);
    });
  }, []);

  const filteredWells = wells.filter((w) => {
    const matchesSearch =
      w.well_id.toLowerCase().includes(search.toLowerCase()) ||
      w.well_name.toLowerCase().includes(search.toLowerCase()) ||
      w.field.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Well Master & Asset Inventory
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Exploration and development wells across Upper Assam Shelf, Duliajan, and benchmark proxies.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-[#88713C]/20 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <Search className="w-4 h-4 text-ink-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Well ID, Name, Field..."
              className="text-xs text-ink placeholder-gray-400 bg-transparent focus:outline-none w-56"
            />
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-bold bg-cream-50 border border-gray-300 rounded-lg px-2.5 py-1 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRILLING">Drilling</option>
            <option value="PRODUCING">Producing</option>
            <option value="COMPLETED">Completed</option>
            <option value="ABANDONED">Abandoned</option>
          </select>
        </div>
      </div>

      {/* Wells Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredWells.map((well) => {
          const isActive = well.well_id === activeWellId;

          return (
            <div
              key={well.well_id}
              className={`card-surface p-5 transition-all space-y-4 relative ${
                isActive ? 'ring-2 ring-brand-brown bg-[#FFFDF9]' : 'hover:shadow-card-hover'
              }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-brand-dark bg-[#F5D867]/40 px-2 py-0.5 rounded-full border border-brand-brown/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-brown animate-ping" />
                  ACTIVE WELL
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-ink">{well.well_id}</span>
                  <Badge variant="provenance" provenance={well.provenance} />
                </div>
                <h3 className="font-bold text-sm text-ink mt-1">{well.well_name}</h3>
                <div className="text-xs text-ink-muted mt-0.5">
                  {well.field} Field • {well.block} ({well.basin})
                </div>
              </div>

              {/* Coordinates and Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-cream-50/70 p-3 rounded-xl border border-cream-200">
                <div>
                  <span className="text-ink-muted block text-[11px]">Total Depth (MD):</span>
                  <strong className="text-ink font-mono">{well.total_depth_md.toFixed(0)} m</strong>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Current Formation:</span>
                  <strong className="text-brand-brown">{well.current_formation}</strong>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Surface Lat/Lon:</span>
                  <span className="font-mono text-[10px] text-gray-700">
                    {well.latitude.toFixed(3)}°, {well.longitude.toFixed(3)}°
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Status:</span>
                  <span className="font-semibold text-ink">{well.status}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveWellId(well.well_id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-brand-brown text-white border-brand-brown'
                      : 'bg-white text-ink border-gray-300 hover:bg-cream-50'
                  }`}
                >
                  {isActive ? 'Selected' : 'Set as Active'}
                </button>

                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/wells/${well.well_id}`}
                    className="p-1.5 text-ink-muted hover:text-ink hover:bg-gray-100 rounded-lg"
                    title="Well Profile"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/map?focus=${well.well_id}`}
                    className="p-1.5 text-ink-muted hover:text-ink hover:bg-gray-100 rounded-lg"
                    title="Locate on Map"
                  >
                    <MapPin className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/correlation?offset=${well.well_id}`}
                    className="p-1.5 text-ink-muted hover:text-ink hover:bg-gray-100 rounded-lg"
                    title="Formation Correlation"
                  >
                    <Layers className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
