import React, { useEffect, useState } from 'react';
import {
  MapPin, Compass, Filter, Layers, Sliders, ArrowRight,
  ShieldAlert, FileText, ChevronRight, Eye, Info
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { Well, OffsetWellRelevance } from '../types';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export const OffsetMap: React.FC = () => {
  const { activeWellId, setSelectedOffsetId, selectedOffsetId } = useAppStore();
  const [wells, setWells] = useState<Well[]>([]);
  const [offsets, setOffsets] = useState<OffsetWellRelevance[]>([]);
  const [radius, setRadius] = useState<number>(15.0);
  const [filterFormation, setFilterFormation] = useState<string>('ALL');
  const [selectedWellDetail, setSelectedWellDetail] = useState<OffsetWellRelevance | null>(null);

  useEffect(() => {
    Promise.all([
      api.getWells(),
      api.getNearbyOffsets(activeWellId, radius)
    ]).then(([wellsData, offsetData]) => {
      setWells(wellsData);
      setOffsets(offsetData);
      if (offsetData.length > 0 && !selectedWellDetail) {
        setSelectedWellDetail(offsetData[0]);
        setSelectedOffsetId(offsetData[0].well_id);
      }
    });
  }, [activeWellId, radius]);

  const activeWell = wells.find(w => w.well_id === activeWellId);

  // Filtered offsets
  const filteredOffsets = offsets.filter(off => {
    if (filterFormation !== 'ALL' && !off.field.toLowerCase().includes(filterFormation.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleSelectOffset = (off: OffsetWellRelevance) => {
    setSelectedWellDetail(off);
    setSelectedOffsetId(off.well_id);
  };

  // Coordinates mapping for interactive SVG canvas centered at Upper Assam
  // Reference center: lat 27.35, lon 95.32
  const centerLat = activeWell ? activeWell.latitude : 27.3582;
  const centerLon = activeWell ? activeWell.longitude : 95.3184;

  const latToY = (lat: number) => {
    return 300 - (lat - centerLat) * 3200;
  };
  const lonToX = (lon: number) => {
    return 400 + (lon - centerLon) * 3200;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Geospatial Offset Intelligence Map
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Spatial radius discovery, 3D trajectory proximity, and multi-criteria geological relevance scoring.
          </p>
        </div>

        {/* Radius Filter & Controls */}
        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-[#88713C]/20 shadow-sm">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-brown" />
            <span className="text-xs font-bold text-ink">Radius:</span>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-24 accent-brand-brown cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-brand-brown">{radius} km</span>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-ink-muted">Field:</span>
            <select
              value={filterFormation}
              onChange={(e) => setFilterFormation(e.target.value)}
              className="text-xs font-bold bg-cream-50 border border-gray-300 rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="ALL">All Fields</option>
              <option value="Duliajan">Duliajan Field</option>
              <option value="Moran">Moran Field</option>
              <option value="Tengakhat">Tengakhat Field</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Map & Offset List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Geospatial Map (8 Cols) */}
        <div className="lg:col-span-8 card-surface p-5 flex flex-col h-[650px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-brown" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Upper Assam Block • Spatial & Subsurface Proximity
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-muted">
                {filteredOffsets.length} Candidate Wells Discovered
              </span>
              <Badge variant="provenance" provenance="SYNTHETIC" />
            </div>
          </div>

          {/* Interactive Geospatial Canvas */}
          <div className="flex-1 bg-[#F5EEDC] rounded-xl border border-[#D6C294] relative overflow-hidden flex items-center justify-center shadow-inner">
            <svg
              viewBox="0 0 800 600"
              className="w-full h-full select-none"
            >
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(136, 113, 60, 0.08)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="800" height="600" fill="url(#grid)" />

              {/* Radius Circle Overlay */}
              <circle
                cx={lonToX(centerLon)}
                cy={latToY(centerLat)}
                r={radius * 18}
                fill="rgba(155, 171, 100, 0.12)"
                stroke="#9BAB64"
                strokeWidth="2"
                strokeDasharray="6,4"
              />
              <text
                x={lonToX(centerLon) + radius * 18 - 40}
                y={latToY(centerLat) - 10}
                fill="#596634"
                fontSize="11"
                fontWeight="bold"
              >
                {radius} km Boundary
              </text>

              {/* Offset Wells */}
              {filteredOffsets.map((off) => {
                const x = lonToX(off.longitude);
                const y = latToY(off.latitude);
                const isSelected = selectedWellDetail?.well_id === off.well_id;

                return (
                  <g
                    key={off.well_id}
                    onClick={() => handleSelectOffset(off)}
                    className="cursor-pointer group"
                  >
                    {/* Trajectory connector line to active well */}
                    <line
                      x1={lonToX(centerLon)}
                      y1={latToY(centerLat)}
                      x2={x}
                      y2={y}
                      stroke={isSelected ? "#88713C" : "rgba(136, 113, 60, 0.25)"}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? "none" : "3,3"}
                    />

                    {/* Proximity Halo */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="20"
                        fill="none"
                        stroke="#88713C"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Well Head Marker */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? "9" : "7"}
                      fill={off.historical_event_count > 0 ? "#D32F2F" : "#3B82F6"}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Well Label */}
                    <text
                      x={x + 12}
                      y={y + 4}
                      fill="#111111"
                      fontSize="11"
                      fontWeight="bold"
                      className="bg-white"
                    >
                      {off.well_id}
                    </text>
                    <text
                      x={x + 12}
                      y={y + 16}
                      fill="#6B6861"
                      fontSize="10"
                    >
                      {off.distance_km}km • {off.relevance_score.toFixed(0)}% Rel
                    </text>
                  </g>
                );
              })}

              {/* Active Well (Center Anchor) */}
              <g className="cursor-default">
                <circle
                  cx={lonToX(centerLon)}
                  cy={latToY(centerLat)}
                  r="24"
                  fill="none"
                  stroke="#F5D867"
                  strokeWidth="3"
                  className="animate-spin"
                  strokeDasharray="8,6"
                />
                <circle
                  cx={lonToX(centerLon)}
                  cy={latToY(centerLat)}
                  r="11"
                  fill="#88713C"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                />
                <text
                  x={lonToX(centerLon) - 45}
                  y={latToY(centerLat) - 20}
                  fill="#111111"
                  fontSize="12"
                  fontWeight="bold"
                >
                  ACTIVE: {activeWellId}
                </text>
              </g>
            </svg>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-[#88713C]/20 rounded-xl p-3 text-xs shadow-md space-y-1.5">
              <div className="font-bold text-ink mb-1 text-[11px] uppercase tracking-wider">Map Legend</div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#88713C] border-2 border-white" />
                <span>Active Well ({activeWellId})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 border-2 border-white" />
                <span>Offset with Documented Incident</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                <span>Offset Well (Nominal Record)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Offset Well Details & Relevance Breakdown (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {selectedWellDetail ? (
            <div className="card-surface p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-ink">
                    {selectedWellDetail.well_name}
                  </h3>
                  <div className="text-xs text-ink-muted">
                    {selectedWellDetail.field} Field • TD: {selectedWellDetail.total_depth_md}m
                  </div>
                </div>
                <Badge variant="provenance" provenance={selectedWellDetail.provenance} />
              </div>

              {/* Composite Relevance Score */}
              <div className="bg-[#FAF2DF] border border-[#88713C]/25 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                  Multi-Criteria Offset Relevance
                </span>
                <div className="text-4xl font-black text-ink mt-1">
                  {selectedWellDetail.relevance_score.toFixed(1)}%
                </div>
                <p className="text-[11px] text-ink-muted mt-1">
                  Weighted across spatial distance, formation similarity, depth overlap, and event relevance.
                </p>
              </div>

              {/* Sub-components breakdown (mandated by PRD: do not show opaque score alone) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Relevance Factors Breakdown
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-cream-50 rounded-lg">
                    <span className="text-ink-muted">Surface Distance:</span>
                    <strong className="text-ink">{selectedWellDetail.distance_km} km ({selectedWellDetail.azimuth_deg}° Azimuth)</strong>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-cream-50 rounded-lg">
                    <span className="text-ink-muted">Formation Overlap:</span>
                    <span className="text-emerald-700 font-bold">{(selectedWellDetail.formation_similarity * 100).toFixed(0)}% (Tipam Match)</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-cream-50 rounded-lg">
                    <span className="text-ink-muted">Depth Overlap:</span>
                    <strong className="text-ink">{selectedWellDetail.depth_overlap_m.toFixed(0)} m in Target Zone</strong>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-cream-50 rounded-lg">
                    <span className="text-ink-muted">3D Trajectory Proximity:</span>
                    <strong className="text-ink">~{selectedWellDetail.trajectory_proximity_m.toFixed(0)} m lateral</strong>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-cream-50 rounded-lg">
                    <span className="text-ink-muted">Historical Incidents:</span>
                    <span className={clsx(
                      "font-bold",
                      selectedWellDetail.historical_event_count > 0 ? "text-red-700" : "text-gray-700"
                    )}>
                      {selectedWellDetail.historical_event_count} documented events
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                <Link
                  to={`/correlation?offset=${selectedWellDetail.well_id}`}
                  className="w-full py-2.5 px-4 bg-ink hover:bg-ink-light text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Layers className="w-4 h-4 text-[#F5D867]" />
                  <span>Compare Formation Correlation</span>
                </Link>

                <Link
                  to={`/wells/${selectedWellDetail.well_id}`}
                  className="w-full py-2.5 px-4 bg-cream-50 hover:bg-cream-200/50 text-ink text-xs font-bold rounded-xl border border-[#88713C]/20 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4 text-brand-brown" />
                  <span>Open Well Profile</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="card-surface p-8 text-center text-xs text-ink-muted">
              Select an offset well from the map or list to inspect multi-criteria relevance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
