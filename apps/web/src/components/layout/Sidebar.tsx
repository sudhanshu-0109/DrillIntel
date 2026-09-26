import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  MapPin,
  GitCompare,
  FileText,
  Bot,
  ShieldAlert,
  FolderTree,
  Bell,
  Sliders,
  Flame
} from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../../store/useAppStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  accent: string;
}

export const Sidebar: React.FC = () => {
  const { latestRisk } = useAppStore();
  const isHighRisk = latestRisk?.risk_class === 'HIGH';

  const navItems: NavItem[] = [
    { to: '/', label: 'Command Center', icon: <LayoutDashboard className="w-5 h-5" />, accent: 'group-hover:text-[#F5D867]' },
    { to: '/live', label: 'Live Operations', icon: <Activity className="w-5 h-5" />, accent: 'group-hover:text-[#B7CBEB]' },
    { to: '/map', label: 'Offset Map', icon: <MapPin className="w-5 h-5" />, accent: 'group-hover:text-[#9BAB64]' },
    { to: '/correlation', label: 'Formation Correlation', icon: <GitCompare className="w-5 h-5" />, accent: 'group-hover:text-[#9BAB64]' },
    { to: '/documents', label: 'Document Intelligence', icon: <FileText className="w-5 h-5" />, accent: 'group-hover:text-[#FF9AD5]' },
    { to: '/assistant', label: 'AI Assistant', icon: <Bot className="w-5 h-5" />, accent: 'group-hover:text-[#FF9AD5]' },
    { to: '/risk', label: 'Risk Analytics', icon: <ShieldAlert className="w-5 h-5" />, accent: 'group-hover:text-red-400' },
    { to: '/wells', label: 'Well Explorer', icon: <FolderTree className="w-5 h-5" />, accent: 'group-hover:text-[#D6C294]' },
    { to: '/alerts', label: 'Decision Alerts', icon: <Bell className="w-5 h-5" />, accent: 'group-hover:text-red-400' },
    { to: '/admin', label: 'Admin & Governance', icon: <Sliders className="w-5 h-5" />, accent: 'group-hover:text-gray-300' },
  ];

  return (
    <aside className="w-[72px] bg-[#111111] text-white flex flex-col items-center py-5 shrink-0 z-30 select-none shadow-xl border-r border-white/5">
      {/* Brand Icon */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#88713C] to-[#54431B] flex items-center justify-center shadow-lg border border-[#B0975C]/30">
          <Flame className="w-6 h-6 text-[#F5D867]" />
        </div>
        <span className="text-[9px] font-black tracking-widest text-[#F5D867] mt-1 uppercase">
          NWIS
        </span>
      </div>

      {/* Primary Navigation Icons */}
      <nav className="flex-1 w-full space-y-1.5 px-2 flex flex-col items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "relative group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white shadow-inner font-bold"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={clsx("transition-transform duration-150 group-hover:scale-110", item.accent)}>
                  {item.icon}
                </div>

                {/* Left Active Indicator Bar */}
                {isActive && (
                  <span className="absolute -left-2 w-1.5 h-6 bg-[#F5D867] rounded-r-full" />
                )}

                {/* Risk alert pulse indicator on Risk / Alerts icons */}
                {(item.to === '/alerts' || item.to === '/risk') && isHighRisk && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}

                {/* Floating Tooltip */}
                <span className="absolute left-[76px] whitespace-nowrap bg-black text-white text-xs px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl border border-white/10">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Avatar Footnote */}
      <div className="mt-auto flex flex-col items-center pt-4 border-t border-white/10">
        <div className="w-8 h-8 rounded-full bg-[#88713C] border border-[#F5D867]/40 flex items-center justify-center text-xs font-bold text-white shadow-sm">
          PS
        </div>
      </div>
    </aside>
  );
};
