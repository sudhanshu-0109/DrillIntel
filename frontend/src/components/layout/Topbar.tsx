import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Play, Pause, RotateCcw,
  ChevronDown, ShieldAlert
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { getAssignedWellsForUser } from '../../services/assignedWells';
import { Badge } from '../ui/Badge';
import clsx from 'clsx';

export const Topbar: React.FC = () => {
  const {
    activeWellId,
    setActiveWellId,
    currentDepth,
    currentFormation,
    connectionStatus,
    isSimulatorRunning,
    simulatorSpeed,
    latestRisk,
    openAlertDrawer,
    currentUser
  } = useAppStore();

  const navigate = useNavigate();
  const assignedWells = getAssignedWellsForUser(currentUser.username);

  const handleStartSim = async () => {
    try {
      await api.startSimulator();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePauseSim = async () => {
    try {
      await api.pauseSimulator();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetSim = async () => {
    try {
      await api.resetSimulator();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeedChange = async (speed: number) => {
    try {
      await api.setSimulatorSpeed(speed);
    } catch (e) {
      console.error(e);
    }
  };

  const initials = currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="h-16 px-6 bg-[#FAF4E6]/95 backdrop-blur border-b border-[#88713C]/15 text-ink flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left Context: Active Well Selector (Scoped ONLY to assigned wells) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Active Well:
          </label>
          <div className="relative">
            <select
              value={activeWellId}
              onChange={(e) => {
                setActiveWellId(e.target.value);
              }}
              className="appearance-none bg-white font-bold text-xs text-ink pl-3 pr-8 py-1.5 rounded-lg border border-[#88713C]/30 shadow-sm cursor-pointer hover:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown transition-colors"
            >
              {assignedWells.map((w) => (
                <option key={w.well_id} value={w.well_id}>
                  {w.well_id} — {w.well_name} ({w.field})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          </div>
        </div>

        <div className="h-5 w-px bg-[#88713C]/20" />

        {/* Current Depth & Formation */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-ink-muted">
            Depth: <strong className="text-ink font-mono font-bold text-sm">{currentDepth.toFixed(1)}m</strong>
          </span>
          <span className="text-ink-muted">
            Formation: <strong className="text-brand-brown font-semibold">{currentFormation}</strong>
          </span>
        </div>

        <Badge variant="provenance" provenance="SYNTHETIC" />
      </div>

      {/* Center: Realtime Telemetry Controls */}
      <div className="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-xl border border-[#88713C]/20 shadow-sm">
        <div className="flex items-center gap-1.5 mr-2">
          <span className={clsx(
            "w-2 h-2 rounded-full",
            connectionStatus === 'CONNECTED' ? "bg-emerald-500 animate-pulse" : "bg-red-500"
          )} />
          <span className="text-[11px] font-bold tracking-wider uppercase text-ink">
            {connectionStatus}
          </span>
        </div>

        <div className="h-4 w-px bg-gray-200" />

        {/* Play / Pause / Reset */}
        <div className="flex items-center gap-1">
          {isSimulatorRunning ? (
            <button
              onClick={handlePauseSim}
              className="p-1 rounded text-ink-muted hover:text-amber-700 hover:bg-amber-50"
              title="Pause Live Telemetry Replay"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleStartSim}
              className="p-1 rounded text-ink-muted hover:text-emerald-700 hover:bg-emerald-50"
              title="Start Live Telemetry Replay"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleResetSim}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-gray-100"
            title="Reset Telemetry to Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Toggles */}
        <div className="flex items-center gap-0.5 text-[10px] font-bold text-ink-muted">
          {[1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={clsx(
                "px-1.5 py-0.5 rounded transition-all",
                simulatorSpeed === s
                  ? "bg-[#88713C] text-white font-bold"
                  : "hover:bg-gray-100"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Right: Decision Alert Bell & Profile */}
      <div className="flex items-center gap-3">
        {/* ML High Risk Alert notification button */}
        {latestRisk?.risk_class === 'HIGH' && (
          <button
            onClick={() => {
              openAlertDrawer({
                alert_id: 'ALT-003-LIVE',
                well_id: activeWellId,
                event_type: latestRisk.event_type,
                severity: 'HIGH',
                depth: currentDepth,
                formation: currentFormation,
                timestamp: new Date().toISOString(),
                probability: latestRisk.probability,
                model_version: latestRisk.model_version,
                reason: latestRisk.explanation || 'Elevated risk detected',
                top_features: latestRisk.top_features,
                historical_evidence: [
                  { well_id: 'NWIS-ASSAM-001', depth: 3265, formation: 'Tipam Sandstone', similarity: 0.94 }
                ],
                source_documents: [
                  { document_id: 'DDR-0032', page: 14, title: 'DDR - NWIS-ASSAM-001' }
                ],
                status: 'OPEN'
              });
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-900 border border-red-300 rounded-xl text-xs font-bold shadow-sm hover:bg-red-200 transition-all animate-pulse cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-red-700" />
            <span>CRITICAL ALERT: Stuck Pipe ({(latestRisk.probability * 100).toFixed(0)}%)</span>
          </button>
        )}

        {/* Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#88713C]/20">
          <div className="text-right">
            <div className="text-xs font-bold text-ink leading-tight">{currentUser.fullName}</div>
            <div className="text-[10px] text-ink-muted">{currentUser.role.replace('_', ' ')} (eRTMAC)</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#88713C] to-[#C9AE73] text-white font-bold flex items-center justify-center text-xs shadow-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
