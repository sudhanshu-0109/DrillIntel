import React from 'react';
import clsx from 'clsx';
import { ProvenanceType } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'provenance' | 'event' | 'severity' | 'status' | 'category';
  provenance?: ProvenanceType;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: string;
  category?: 'research' | 'ops' | 'geo' | 'live';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'status',
  provenance,
  severity,
  category,
  className
}) => {
  // Provenance styles
  if (variant === 'provenance' && provenance) {
    if (provenance === 'SYNTHETIC') {
      return (
        <span className={clsx(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border",
          "bg-[#F5EFE0] text-[#7A6129] border-[#D6C294]",
          className
        )}>
          SYNTHETIC / DEMO
        </span>
      );
    }
    if (provenance === 'PUBLIC') {
      return (
        <span className={clsx(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border",
          "bg-[#EBF3FB] text-[#205282] border-[#ADCDEB]",
          className
        )}>
          PUBLIC DATA
        </span>
      );
    }
    if (provenance === 'AUTHORIZED') {
      return (
        <span className={clsx(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border",
          "bg-[#EAF5EA] text-[#226725] border-[#99D29D]",
          className
        )}>
          AUTHORIZED DATA
        </span>
      );
    }
    return (
      <span className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border",
        "bg-gray-100 text-gray-700 border-gray-300",
        className
      )}>
        DERIVED
      </span>
    );
  }

  // Risk Severity styles
  if (variant === 'severity' && severity) {
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      return (
        <span className={clsx(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase",
          "bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]",
          className
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C] mr-1.5 animate-pulse" />
          {severity} RISK
        </span>
      );
    }
    if (severity === 'MEDIUM') {
      return (
        <span className={clsx(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase",
          "bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]",
          className
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] mr-1.5" />
          MEDIUM RISK
        </span>
      );
    }
    return (
      <span className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase",
        "bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]",
        className
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] mr-1.5" />
        LOW RISK
      </span>
    );
  }

  // Category Pastel tags
  if (category === 'research') {
    return (
      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FF9AD5]/25 text-[#731E4E] border border-[#FF9AD5]/50", className)}>
        {children}
      </span>
    );
  }
  if (category === 'ops') {
    return (
      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5D867]/30 text-[#6B5508] border border-[#F5D867]/60", className)}>
        {children}
      </span>
    );
  }
  if (category === 'geo') {
    return (
      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#9BAB64]/25 text-[#3C4A19] border border-[#9BAB64]/50", className)}>
        {children}
      </span>
    );
  }
  if (category === 'live') {
    return (
      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#B7CBEB]/30 text-[#1F3D68] border border-[#B7CBEB]/60", className)}>
        {children}
      </span>
    );
  }

  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800", className)}>
      {children}
    </span>
  );
};
