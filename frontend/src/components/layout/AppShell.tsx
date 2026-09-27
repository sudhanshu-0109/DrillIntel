import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ContextDrawer } from './ContextDrawer';
import { useAppStore } from '../../store/useAppStore';
import { connectWebSocket, disconnectWebSocket } from '../../services/websocket';

export const AppShell: React.FC = () => {
  const { activeWellId } = useAppStore();
  const { pathname } = useLocation();

  // /plan requires full viewport without outer scroll wrapper
  const isMapPage = pathname === '/plan';

  useEffect(() => {
    connectWebSocket(activeWellId);
    return () => {
      disconnectWebSocket();
    };
  }, [activeWellId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cream-100 font-sans antialiased text-ink">
      {/* Icon-First Sleek Dark Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Persistent Top Navigation Bar */}
        <Topbar />

        {/* Dynamic Working Canvas */}
        {isMapPage ? (
          <main className="flex-1 min-h-0 w-full overflow-hidden relative bg-[#0d0d0d]">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 min-h-0 w-full overflow-y-auto bg-cream-100 p-4 sm:p-6 lg:p-8 text-ink">
            <Outlet />
          </main>
        )}
      </div>

      {/* Contextual Intelligence Slide-over Drawer */}
      <ContextDrawer />
    </div>
  );
};

export default AppShell;
