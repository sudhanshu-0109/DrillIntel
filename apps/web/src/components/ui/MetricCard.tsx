import React from 'react';
import clsx from 'clsx';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  category?: 'research' | 'ops' | 'geo' | 'live';
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  trend,
  trendValue,
  category,
  icon,
  badge,
  className,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "card-surface p-5 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-card-hover hover:border-[#88713C]/20",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold tracking-wider uppercase text-ink-muted">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && <div className="text-ink-muted">{icon}</div>}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-ink">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-semibold text-ink-muted">
            {unit}
          </span>
        )}
      </div>

      {(subtext || trendValue) && (
        <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
          {subtext && <span>{subtext}</span>}
          {trendValue && (
            <span className={clsx(
              "font-medium inline-flex items-center gap-0.5",
              trend === 'up' && "text-amber-700",
              trend === 'down' && "text-emerald-700",
              trend === 'neutral' && "text-gray-500"
            )}>
              {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'} {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
