import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { CommandCenter } from './pages/CommandCenter';
import { WellExplorer } from './pages/WellExplorer';
import { WellIntelligence } from './pages/WellIntelligence';
import { OffsetMap } from './pages/OffsetMap';
import { FormationCorrelation } from './pages/FormationCorrelation';
import { DocumentIntelligence } from './pages/DocumentIntelligence';
import { AIAssistant } from './pages/AIAssistant';
import { LiveOperations } from './pages/LiveOperations';
import { RiskAnalytics } from './pages/RiskAnalytics';
import { DecisionAlerts } from './pages/DecisionAlerts';
import { AdminGovernance } from './pages/AdminGovernance';
import { Login } from './pages/Login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected App Shell */}
          <Route element={<AppShell />}>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/command-center" element={<Navigate to="/" replace />} />
            <Route path="/wells" element={<WellExplorer />} />
            <Route path="/wells/:wellId" element={<WellIntelligence />} />
            <Route path="/map" element={<OffsetMap />} />
            <Route path="/correlation" element={<FormationCorrelation />} />
            <Route path="/documents" element={<DocumentIntelligence />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/live" element={<LiveOperations />} />
            <Route path="/risk" element={<RiskAnalytics />} />
            <Route path="/alerts" element={<DecisionAlerts />} />
            <Route path="/admin" element={<AdminGovernance />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
