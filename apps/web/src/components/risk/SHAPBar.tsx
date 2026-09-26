import React from 'react';
import clsx from 'clsx';
import { SHAPContributor } from '../../types';

interface SHAPBarProps {
  contributors: SHAPContributor[];
  plainExplanation?: string;
  className?: string;
}

export const SHAPBar: React.FC<SHAPBarProps> = ({
  contributors,
  plainExplanation,
  className
}) => {
  // Max absolute SHAP value for scaling bars
  const maxVal = Math.max(...contributors.map(c => Math.abs(c.shap_value)), 0.1);

  return (
    <div className={clsx("space-y-4", className)}>
      {plainExplanation && (
        <div className="bg-[#FAF2DF] border border-[#88713C]/20 rounded-xl p-3.5 text-xs text-ink leading-relaxed">
          <div className="font-semibold text-brand-dark mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-brown" />
            Physics & Empirical Explanation (SHAP Attribution)
          </div>
          <p>{plainExplanation}</p>
        </div>
      )}

      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider flex items-center justify-between">
          <span>Top Contributing Signals</span>
          <span>SHAP Impact</span>
        </div>

        {contributors.map((c, idx) => {
          const isPositive = c.shap_value >= 0;
          const barWidth = Math.min(100, Math.round((Math.abs(c.shap_value) / maxVal) * 100));

          return (
            <div key={idx} className="bg-cream-50 border border-gray-200/60 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-ink">
                  {c.display_name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-ink-muted">
                    Val: <strong>{c.feature_value}</strong>
                  </span>
                  <span className={clsx(
                    "font-mono font-bold text-[11px] px-1.5 py-0.5 rounded",
                    isPositive ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                  )}>
                    {isPositive ? `+${c.shap_value.toFixed(2)}` : c.shap_value.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Relative impact progress bar */}
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-300",
                    isPositive ? "bg-red-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
