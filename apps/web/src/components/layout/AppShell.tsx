import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ContextDrawer } from './ContextDrawer';
import { useAppStore } from '../../store/useAppStore';
import { connectWebSocket, disconnectWebSocket } from '../../services/websocket';

export const AppShell: React.FC = () => {
  const { activeWellId } = useAppStore();

  useEffect(() => {
    connectWebSocket(activeWellId);
    return () => {
      disconnectWebSocket();
    };
  }, [activeWellId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cream-100 font-sans">
      {/* Icon-First Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Persistent Top Navigation Bar */}
        <Topbar />

        {/* Scrollable Main Working Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FBF4E6]">
          <div className="max-w-[1720px] mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Contextual Intelligence Slide-over Drawer */}
      <ContextDrawer />
    </div>
  );
};
