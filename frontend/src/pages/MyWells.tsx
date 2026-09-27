import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ShieldAlert, ArrowRight, PlusCircle, Compass,
  Layers, MapPin, CheckCircle, Clock, Radio, ChevronRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getAssignedWellsForUser } from '../services/assignedWells';
import { Badge } from '../components/ui/Badge';
import clsx from 'clsx';

export const MyWells: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    activeWellId,
    setActiveWellId,
    currentDepth,
    currentFormation,
    connectionStatus,
    latestRisk
  } = useAppStore();

  const assignedWells = getAssignedWellsForUser(currentUser.username);
  const firstName = currentUser.fullName.split(' ')[0];

  const handleSelectWell = (wellId: string) => {
    setActiveWellId(wellId);
    navigate('/workspace');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header Greeting Banner ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Drilling Operations • Monitoring <strong className="text-ink font-semibold">{assignedWells.length} active wells</strong> assigned to your operational rotation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/plan')}
            className="px-4 py-2.5 bg-[#88713C] hover:bg-[#685429] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#F5D867]" />
            <span>Plan New Well</span>
          </button>
          <button
            onClick={() => navigate('/map')}
            className="px-4 py-2.5 bg-ink hover:bg-ink-light text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-[#F5D867]" />
            <span>Offset Wells Map</span>
          </button>
        </div>
      </div>

      {/* ── Section Title ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#88713C]/15 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#88713C] animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
            My Active Wells
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            {assignedWells.length} ONLINE
          </span>
        </div>
        <span className="text-xs text-ink-muted">
          Click any well card to open its dedicated decision workspace
        </span>
      </div>

      {/* ── Active Wells Cards Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedWells.map((well) => {
          const isSelected = well.well_id === activeWellId;
          const displayDepth = isSelected ? currentDepth : well.current_depth;
          const displayFormation = isSelected ? currentFormation : well.current_formation;

          return (
            <div
              key={well.well_id}
              onClick={() => handleSelectWell(well.well_id)}
              className={clsx(
                "group relative bg-white rounded-[20px] p-6 shadow-card border transition-all duration-200 cursor-pointer flex flex-col justify-between",
                isSelected
                  ? "border-[#88713C] ring-2 ring-[#88713C]/20 shadow-card-hover"
                  : "border-[#88713C]/15 hover:border-[#88713C]/40 hover:shadow-card-hover"
              )}
            >
              <div>
                {/* Card Top: Well Name + Badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-ink-muted uppercase tracking-wider">
                      {well.well_id}
                    </span>
                    <h3 className="text-lg font-bold text-ink group-hover:text-brand-brown transition-colors">
                      {well.well_name}
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {well.field} • Upper Assam
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                    {well.alert_count > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        {well.alert_count} ALERTS
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        0 ALERTS
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#88713C]/10 my-3">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                      Bit Depth
                    </div>
                    <div className="text-xl font-black font-mono text-ink">
                      {displayDepth.toFixed(1)} <span className="text-xs font-normal text-ink-muted">m</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                      Formation
                    </div>
                    <div className="text-xs font-bold text-brand-brown truncate" title={displayFormation}>
                      {displayFormation}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                      Status
                    </div>
                    <div className="text-xs font-bold text-ink flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {well.status}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                      Bit Speed
                    </div>
                    <div className="text-xs font-mono font-bold text-ink">
                      {120} <span className="text-[10px] text-ink-muted font-normal">rpm</span>
                    </div>
                  </div>
                </div>

                {/* Geological Target Note */}
                <div className="text-[11px] text-ink-muted bg-cream-50 p-2.5 rounded-xl border border-[#88713C]/10 flex items-center justify-between">
                  <span>Target: <strong>{well.total_depth_md}m</strong></span>
                  <span className="font-mono text-brand-brown font-semibold">
                    {((displayDepth / well.total_depth_md) * 100).toFixed(0)}% reached
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-[#88713C]/10 flex items-center justify-between">
                <span className="text-xs font-bold text-brand-brown group-hover:text-brand-dark transition-colors">
                  Open Well Workspace
                </span>
                <div className="w-7 h-7 rounded-lg bg-cream-100 group-hover:bg-[#88713C] group-hover:text-white text-ink flex items-center justify-center transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Plan Banner ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] p-6 shadow-card border border-[#88713C]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cream-100 border border-[#88713C]/20 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6 text-[#88713C]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">Planning an exploratory or development well?</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Launch automated location & depth intelligence across regional offset wells, historical stuck pipe cases, and DDR archives.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/plan')}
          className="px-5 py-2.5 bg-[#88713C] hover:bg-[#685429] text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <span>Launch Well Planner</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MyWells;
