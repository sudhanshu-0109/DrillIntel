import React, { useEffect, useState } from 'react';
import {
  Activity, Play, Pause, RotateCcw, AlertTriangle,
  Zap, Gauge, TrendingUp, Layers, CheckCircle2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { RiskGauge } from '../components/risk/RiskGauge';
import clsx from 'clsx';

export const LiveOperations: React.FC = () => {
  const {
    activeWellId,
    currentDepth,
    currentFormation,
    connectionStatus,
    isSimulatorRunning,
    simulatorSpeed,
    latestTelemetry,
    telemetryHistory,
    latestRisk,
    openAlertDrawer
  } = useAppStore();

  const handleStart = () => api.startSimulator();
  const handlePause = () => api.pauseSimulator();
  const handleReset = () => api.resetSimulator();
  const handleSpeed = (s: number) => api.setSimulatorSpeed(s);

  // Recent data slice for SVG charting (last 30 samples)
  const chartPoints = telemetryHistory.slice(-30);

  // SVG Chart Helper
  const renderSparkline = (
    data: number[],
    minVal: number,
    maxVal: number,
    strokeColor: string,
    fillColor: string
  ) => {
    if (data.length < 2) return null;
    const width = 360;
    const height = 110;
    const range = Math.max(0.1, maxVal - minVal);

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 20) - 10;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Latest point circle */}
        {data.length > 0 && (
          <circle
            cx={width}
            cy={height - ((data[data.length - 1] - minVal) / range) * (height - 20) - 10}
            r="4.5"
            fill={strokeColor}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        )}
      </svg>
    );
  };

  const torqueData = chartPoints.map(p => p.torque);
  const ropData = chartPoints.map(p => p.rop);
  const sppData = chartPoints.map(p => p.standpipe_pressure);
  const hookloadData = chartPoints.map(p => p.hookload);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Real-Time Drilling Operations Center
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            WITSML 1-second telemetry streaming, physics-based rolling feature calculations, and automated ML risk inference.
          </p>
        </div>

        {/* Live Simulator Controls */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-[#88713C]/20 shadow-sm">
          <div className="flex items-center gap-2 mr-2">
            <span className={clsx(
              "w-2.5 h-2.5 rounded-full",
              connectionStatus === 'CONNECTED' ? "bg-emerald-500 animate-pulse" : "bg-red-500"
            )} />
            <span className="text-xs font-bold uppercase tracking-wider text-ink">
              {connectionStatus}
            </span>
          </div>

          <div className="h-5 w-px bg-gray-200" />

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {isSimulatorRunning ? (
              <button
                onClick={handlePause}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Replay</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="px-3 py-1.5 bg-ink hover:bg-ink-light text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 text-[#F5D867]" />
                <span>Start Stream</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-ink rounded-xl text-xs font-bold transition-all"
              title="Reset Simulator"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-1 text-xs font-bold text-ink-muted ml-2">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeed(s)}
                className={clsx(
                  "px-2 py-1 rounded-lg text-xs",
                  simulatorSpeed === s ? "bg-[#88713C] text-white" : "bg-gray-100 hover:bg-gray-200"
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts & Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Synchronized Live Parameter Curves (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Torque Curve */}
            <div className="card-surface p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Surface Torque</span>
                <span className="font-mono text-xl font-black text-amber-800">
                  {latestTelemetry?.torque.toFixed(1) || '18.5'} <span className="text-xs font-semibold">kNm</span>
                </span>
              </div>
              <div className="text-[11px] text-red-700 font-semibold mb-2">
                Precursor escalation: +{((latestTelemetry?.torque || 18.5) - 18.0).toFixed(1)} kNm from baseline
              </div>
              {renderSparkline(torqueData, 16.0, 38.0, '#D97706', 'rgba(217, 119, 6, 0.1)')}
            </div>

            {/* ROP Curve */}
            <div className="card-surface p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Rate of Penetration (ROP)</span>
                <span className="font-mono text-xl font-black text-sky-800">
                  {latestTelemetry?.rop.toFixed(1) || '14.2'} <span className="text-xs font-semibold">m/hr</span>
                </span>
              </div>
              <div className="text-[11px] text-sky-700 font-semibold mb-2">
                Deceleration drop index: {((14.0 - (latestTelemetry?.rop || 14.0)) / 14.0 * 100).toFixed(0)}%
              </div>
              {renderSparkline(ropData, 1.0, 16.0, '#0284C7', 'rgba(2, 132, 199, 0.1)')}
            </div>

            {/* Standpipe Pressure Curve */}
            <div className="card-surface p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Standpipe Pressure (SPP)</span>
                <span className="font-mono text-xl font-black text-ink">
                  {latestTelemetry?.standpipe_pressure.toFixed(1) || '182.0'} <span className="text-xs font-semibold">bar</span>
                </span>
              </div>
              <div className="text-[11px] text-ink-muted mb-2">
                Circulation pressure window: nominal 180-210 bar
              </div>
              {renderSparkline(sppData, 170.0, 220.0, '#88713C', 'rgba(136, 113, 60, 0.1)')}
            </div>

            {/* Hookload Curve */}
            <div className="card-surface p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Hookload (String Weight)</span>
                <span className="font-mono text-xl font-black text-ink">
                  {latestTelemetry?.hookload.toFixed(0) || '1250'} <span className="text-xs font-semibold">kN</span>
                </span>
              </div>
              <div className="text-[11px] text-ink-muted mb-2">
                Overpull threshold: 1350 kN (Connection overpull risk)
              </div>
              {renderSparkline(hookloadData, 1200.0, 1420.0, '#475569', 'rgba(71, 85, 105, 0.1)')}
            </div>
          </div>

          {/* Rolling Features & Physics Calculations */}
          <div className="card-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Calculated Rolling & Physics Features
              </h3>
              <Badge category="live">Feature Store</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
                <span className="text-ink-muted block text-[11px]">Δ Torque (15-min):</span>
                <strong className="text-base text-ink font-mono font-bold">
                  +{((latestTelemetry?.torque || 18.5) - 18.0).toFixed(1)} kNm
                </strong>
              </div>

              <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
                <span className="text-ink-muted block text-[11px]">ROP Decel Ratio:</span>
                <strong className="text-base text-ink font-mono font-bold">
                  {((14.0 - (latestTelemetry?.rop || 14.0)) / 14.0).toFixed(2)}
                </strong>
              </div>

              <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
                <span className="text-ink-muted block text-[11px]">Mechanical Specific Energy:</span>
                <strong className="text-base text-ink font-mono font-bold">
                  {Math.round(280 + ((latestTelemetry?.torque || 18.5) * 8.5))} MPa
                </strong>
              </div>

              <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
                <span className="text-ink-muted block text-[11px]">Equivalent Circ. Density:</span>
                <strong className="text-base text-ink font-mono font-bold">
                  {latestTelemetry?.ecd.toFixed(2) || '1.44'} SG
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Live Risk Evaluation & Alerts (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-surface p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-3">
              Real-Time ML Risk Assessment
            </h3>

            {latestRisk && (
              <RiskGauge
                probability={latestRisk.probability}
                riskClass={latestRisk.risk_class}
                eventType={latestRisk.event_type}
                modelVersion={latestRisk.model_version}
              />
            )}

            {latestRisk?.risk_class === 'HIGH' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>PRECURSOR WARNING TRIGGERED</span>
                </div>
                <p className="text-red-950 leading-relaxed">
                  {latestRisk.explanation}
                </p>
                <button
                  onClick={() => openAlertDrawer({
                    alert_id: 'ALT-LIVE-003',
                    well_id: activeWellId,
                    event_type: 'stuck_pipe',
                    severity: 'HIGH',
                    depth: currentDepth,
                    formation: currentFormation,
                    timestamp: new Date().toISOString(),
                    probability: latestRisk.probability,
                    model_version: latestRisk.model_version,
                    reason: latestRisk.explanation || 'Elevated risk detected',
                    top_features: latestRisk.top_features,
                    status: 'OPEN'
                  })}
                  className="mt-2 w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-xs transition-colors"
                >
                  Review Alert & Evidence
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
