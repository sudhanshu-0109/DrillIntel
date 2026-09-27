import React, { useEffect, useState } from 'react';
import {
  GitCompare, Layers, AlertTriangle, FileText,
  ChevronDown, ExternalLink, ArrowRight, Info
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { Well, FormationInterval, EventItem } from '../types';
import { Badge } from '../components/ui/Badge';

export const FormationCorrelation: React.FC = () => {
  const {
    activeWellId,
    selectedOffsetId,
    setSelectedOffsetId,
    currentDepth,
    currentFormation,
    openDocumentViewer,
    openAlertDrawer
  } = useAppStore();

  const [wells, setWells] = useState<Well[]>([]);
  const [activeFormations, setActiveFormations] = useState<FormationInterval[]>([]);
  const [offsetFormations, setOffsetFormations] = useState<FormationInterval[]>([]);
  const [activeEvents, setActiveEvents] = useState<EventItem[]>([]);
  const [offsetEvents, setOffsetEvents] = useState<EventItem[]>([]);
  const [targetOffset, setTargetOffset] = useState<string>(selectedOffsetId || 'NWIS-ASSAM-001');

  useEffect(() => {
    api.getWells().then(setWells);
  }, []);

  useEffect(() => {
    // Load formations and events for active well
    api.getWellFormations(activeWellId).then(setActiveFormations);
    api.getWellEvents(activeWellId).then(setActiveEvents);

    // Load formations and events for target offset well
    api.getWellFormations(targetOffset).then(setOffsetFormations);
    api.getWellEvents(targetOffset).then(setOffsetEvents);
  }, [activeWellId, targetOffset]);

  const handleOffsetChange = (newOffset: string) => {
    setTargetOffset(newOffset);
    setSelectedOffsetId(newOffset);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Formation & Subsurface Correlation
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Depth-aligned lithological correlation between active wellbore and historical offset problem intervals.
          </p>
        </div>

        {/* Offset Well Selector */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-[#88713C]/20 shadow-sm">
          <span className="text-xs font-bold text-ink">Compare Offset:</span>
          <select
            value={targetOffset}
            onChange={(e) => handleOffsetChange(e.target.value)}
            className="text-xs font-bold bg-cream-50 border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-brown"
          >
            {wells.filter(w => w.well_id !== activeWellId).map(w => (
              <option key={w.well_id} value={w.well_id}>
                {w.well_id} — {w.well_name} ({w.field})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Depth & Formation Comparison Canvas */}
      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#88713C]" />
              <span className="font-bold text-sm text-ink">Active Well: {activeWellId}</span>
              <Badge category="live">Current Bit: {currentDepth.toFixed(1)}m</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="font-bold text-sm text-ink">Offset Well: {targetOffset}</span>
              <Badge category="research">Historical Record</Badge>
            </div>
          </div>

          <div className="text-xs text-ink-muted flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-brown" />
            <span>Click any problem interval to inspect original drilling report evidence</span>
          </div>
        </div>

        {/* Depth Correlation Track Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Depth Ruler (1 Col) */}
          <div className="hidden md:flex md:col-span-1 flex-col items-center border-r border-gray-200 pr-2">
            <span className="text-[10px] font-bold text-ink-muted uppercase mb-2">Depth (m)</span>
            <div className="h-[620px] flex flex-col justify-between text-[11px] font-mono font-semibold text-gray-500 py-2">
              <span>0 m</span>
              <span>500 m</span>
              <span>1000 m</span>
              <span>1500 m</span>
              <span>2000 m</span>
              <span>2500 m</span>
              <span>3000 m</span>
              <span className="text-red-600 font-bold bg-red-50 px-1 rounded">3280 m</span>
              <span>3500 m</span>
              <span>4000 m</span>
            </div>
          </div>

          {/* ACTIVE WELL TRACK (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-[#FAF4E6] p-3 rounded-xl border border-[#88713C]/20 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-sm text-ink">{activeWellId}</span>
                <div className="text-xs text-ink-muted">Duliajan Field • Active Rotary Drilling</div>
              </div>
              <Badge variant="provenance" provenance="SYNTHETIC" />
            </div>

            {/* Stratigraphy Column */}
            <div className="space-y-2.5 relative">
              {activeFormations.map((f) => {
                const isCurrent = f.formation_name === currentFormation;
                return (
                  <div
                    key={f.id}
                    className={`p-3.5 rounded-xl border transition-all relative ${
                      isCurrent
                        ? 'bg-[#F5D867]/30 border-brand-brown shadow-sm ring-2 ring-brand-brown/30'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink">{f.formation_name}</span>
                      <span className="font-mono text-ink-muted">{f.top_md}m - {f.bottom_md}m</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Lithology: <strong>{f.lithology}</strong></span>
                      <span>Pore Press: <strong>{f.pore_pressure_gradient} SG</strong></span>
                    </div>

                    {/* Active Bit Depth Line Indicator */}
                    {isCurrent && (
                      <div className="mt-3 pt-2 border-t border-brand-brown/30 flex items-center justify-between bg-white/70 p-2 rounded-lg">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                          Current Bit Depth: {currentDepth.toFixed(1)}m
                        </span>
                        <span className="text-[10px] font-bold uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded">
                          Differential Sticking Risk
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Correlation Linking Indicator (1 Col) */}
          <div className="hidden md:flex md:col-span-1 h-[600px] flex-col items-center justify-center">
            <div className="h-full border-r-2 border-dashed border-[#88713C]/40 relative flex items-center justify-center">
              <div className="absolute top-[72%] -translate-y-1/2 bg-[#88713C] text-white p-1 rounded-full shadow-lg">
                <GitCompare className="w-4 h-4 animate-pulse" />
              </div>
            </div>
          </div>

          {/* OFFSET WELL TRACK (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-sm text-ink">{targetOffset}</span>
                <div className="text-xs text-ink-muted">Historical Offset Well • Completed 2024</div>
              </div>
              <Badge variant="provenance" provenance="SYNTHETIC" />
            </div>

            {/* Stratigraphy Column & Historical Events */}
            <div className="space-y-2.5">
              {offsetFormations.map((f) => {
                // Check if this formation has a historical event in this offset well
                const matchingEvent = offsetEvents.find(e =>
                  (e.depth_start >= f.top_md && e.depth_start <= f.bottom_md) ||
                  (e.formation.toLowerCase().includes(f.formation_name.toLowerCase()))
                );

                return (
                  <div
                    key={f.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      matchingEvent
                        ? 'bg-red-50/80 border-red-300 shadow-sm ring-2 ring-red-400/30'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink">{f.formation_name}</span>
                      <span className="font-mono text-ink-muted">{f.top_md}m - {f.bottom_md}m</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Lithology: <strong>{f.lithology}</strong></span>
                      <span>Fracture: <strong>{f.fracture_gradient} SG</strong></span>
                    </div>

                    {/* Historical Problem Event Highlight */}
                    {matchingEvent && (
                      <div className="mt-3 pt-2 border-t border-red-200 bg-white/90 p-2.5 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-red-900 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            {matchingEvent.title}
                          </span>
                          <span className="font-mono text-[10px] text-red-700 font-bold">
                            {matchingEvent.depth_start}m - {matchingEvent.depth_end}m
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-700 line-clamp-2">
                          {matchingEvent.description}
                        </p>

                        <div className="pt-1 flex items-center justify-between">
                          <button
                            onClick={() => openDocumentViewer(matchingEvent.source_document || 'DDR-0032', matchingEvent.source_page)}
                            className="text-[11px] font-bold text-brand-brown hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Source: {matchingEvent.source_document} (Page {matchingEvent.source_page})</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] text-gray-500 font-mono">48 hrs NPT</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
