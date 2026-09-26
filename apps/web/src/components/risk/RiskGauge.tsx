import React from 'react';
import clsx from 'clsx';
import { Badge } from '../ui/Badge';

interface RiskGaugeProps {
  probability: number; // 0.0 to 1.0
  riskClass: 'LOW' | 'MEDIUM' | 'HIGH';
  eventType: string;
  modelVersion: string;
  size?: number;
  className?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  probability,
  riskClass,
  eventType,
  modelVersion,
  size = 170,
  className
}) => {
  const percentage = Math.round(probability * 100);
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Semi-arc (from 225 deg to -45 deg = 270 deg span)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * probability);

  const getStatusColor = () => {
    if (riskClass === 'HIGH') return '#D32F2F'; // semantic red
    if (riskClass === 'MEDIUM') return '#ED6C02'; // semantic amber
    return '#2E7D32'; // semantic green
  };

  return (
    <div className={clsx("flex flex-col items-center justify-center p-4", className)}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-135"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#EFE8D6"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
          {/* Value track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getStatusColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black tracking-tight text-ink">
            {percentage}%
          </span>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-muted mt-0.5">
            PROBABILITY
          </span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <Badge variant="severity" severity={riskClass}>
          {riskClass} RISK
        </Badge>
        <div className="text-xs text-ink-muted mt-1.5 flex items-center justify-center gap-1.5">
          <span>Target: <strong className="text-ink uppercase">{eventType.replace('_', ' ')}</strong></span>
          <span>•</span>
          <span className="font-mono text-[10px] bg-black/5 px-1.5 py-0.5 rounded">{modelVersion}</span>
        </div>
      </div>
    </div>
  );
};
