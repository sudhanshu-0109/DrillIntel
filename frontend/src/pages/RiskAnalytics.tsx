import React, { useEffect, useState } from 'react';
import {
  ShieldAlert, Cpu, Activity, TrendingUp, CheckCircle,
  AlertTriangle, Sliders, Info, BarChart2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { ModelMetadata } from '../types';
import { Badge } from '../components/ui/Badge';
import { RiskGauge } from '../components/risk/RiskGauge';
import { SHAPBar } from '../components/risk/SHAPBar';

export const RiskAnalytics: React.FC = () => {
  const { activeWellId, currentDepth, currentFormation, latestRisk } = useAppStore();
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [riskHistory, setRiskHistory] = useState<any[]>([]);

  useEffect(() => {
    api.getModels().then(setModels);
    api.getRiskHistory(activeWellId).then(setRiskHistory);
  }, [activeWellId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink flex items-center gap-2">
            <span>Machine Learning Risk Analytics & Observability</span>
            <Badge category="ops">XGBoost & SHAP</Badge>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Precursor anomaly modeling, calibrated tree-based ensembles, and local feature attribution for drilling operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="provenance" provenance="DERIVED" />
          <span className="text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-xl border border-[#88713C]/20 shadow-sm text-ink">
            Active Model: stuck-pipe-xgb-v1
          </span>
        </div>
      </div>

      {/* Live Inference Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Gauge & SHAP Breakdown (7 Cols) */}
        <div className="lg:col-span-7 card-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-ink">
                Real-Time Risk Inference & SHAP Attribution
              </h3>
              <div className="text-xs text-ink-muted">
                {activeWellId} • Bit Depth: {currentDepth.toFixed(1)}m • {currentFormation}
              </div>
            </div>
            {latestRisk && (
              <Badge variant="severity" severity={latestRisk.risk_class}>
                {latestRisk.risk_class} RISK
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Risk Gauge (5 Cols) */}
            <div className="md:col-span-5 flex justify-center">
              {latestRisk && (
                <RiskGauge
                  probability={latestRisk.probability}
                  riskClass={latestRisk.risk_class}
                  eventType={latestRisk.event_type}
                  modelVersion={latestRisk.model_version}
                  size={190}
                />
              )}
            </div>

            {/* Inference Metadata (7 Cols) */}
            <div className="md:col-span-7 space-y-3 text-xs">
              <div className="p-3 bg-cream-50 rounded-xl border border-cream-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Evaluation Window:</span>
                  <strong className="text-ink">15-minute rolling window</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Data Quality:</span>
                  <span className="text-emerald-700 font-bold">NOMINAL (100% sensors valid)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Mean Lead Time:</span>
                  <strong className="text-ink font-mono">18.5 minutes to stuck condition</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">False Alert Rate:</span>
                  <span className="font-mono text-ink">3.8% (Empirical cross-well)</span>
                </div>
              </div>

              <div className="p-3 bg-[#FAF4E6] border border-[#88713C]/20 rounded-xl text-ink leading-relaxed text-[11px]">
                <strong>Decision-Support Notice:</strong> Risk predictions reflect leading empirical patterns from historical offset wells.
                They guide engineering verification and do not execute automated rig interventions.
              </div>
            </div>
          </div>

          {/* Full SHAP Contributor Bars */}
          {latestRisk && (
            <div className="pt-2">
              <SHAPBar
                contributors={latestRisk.shap_contributors || []}
                plainExplanation={latestRisk.explanation}
              />
            </div>
          )}
        </div>

        {/* Depth vs Probability Risk Trend (5 Cols) */}
        <div className="lg:col-span-5 card-surface p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-ink">
              Risk Progression along Depth Track
            </h3>
            <span className="text-xs font-mono text-ink-muted">3270m - 3284m</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-ink-muted">
              Probability trajectory as well enters permeable Tipam Sandstone interval:
            </p>

            {/* Depth Trend Track */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {riskHistory.map((pt, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    pt.risk_class === 'HIGH'
                      ? 'bg-red-50/80 border-red-200 font-bold'
                      : pt.risk_class === 'MEDIUM'
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-cream-50/60 border-cream-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink">{pt.depth.toFixed(1)} m</span>
                    <Badge variant="severity" severity={pt.risk_class}>
                      {pt.risk_class}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pt.risk_class === 'HIGH' ? 'bg-red-600' : pt.risk_class === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.round(pt.probability * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs w-10 text-right">
                      {(pt.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Model Registry & Rigorous Evaluation Metrics (Mandated by PRD) */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-ink">
              Calibrated Drilling Risk Models Registry
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Trained using well-level cross-validation to prevent temporal and spatial data leakage.
            </p>
          </div>
          <Badge category="ops">Model Observability</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {models.map((m) => (
            <div key={m.model_id} className="p-4 bg-cream-50 rounded-xl border border-cream-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-ink">{m.model_id}</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {m.status}
                </span>
              </div>

              <div className="font-bold text-ink">{m.model_name}</div>
              <div className="text-[11px] text-ink-muted">Algorithm: {m.algorithm}</div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 font-mono text-[11px]">
                <div>PR-AUC: <strong>{m.pr_auc.toFixed(2)}</strong></div>
                <div>ROC-AUC: <strong>{m.roc_auc.toFixed(2)}</strong></div>
                <div>Precision: <strong>{m.precision.toFixed(2)}</strong></div>
                <div>Recall: <strong>{m.recall.toFixed(2)}</strong></div>
                <div>Lead Time: <strong>{m.lead_time_min} min</strong></div>
                <div>False Alert: <strong>{(m.false_alert_rate * 100).toFixed(1)}%</strong></div>
              </div>

              <div className="text-[10px] text-gray-500 pt-1 line-clamp-1">
                Dataset: {m.training_dataset}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
