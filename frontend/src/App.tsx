import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { MyWells } from './pages/MyWells';
import { WellWorkspace } from './pages/WellWorkspace';
import { PlanWell } from './pages/PlanWell';
import { EngineeringBriefPage } from './pages/EngineeringBrief';
import { DecisionAlerts } from './pages/DecisionAlerts';
import { AIAssistant } from './pages/AIAssistant';
import { OffsetMap } from './pages/OffsetMap';
import { FormationCorrelation } from './pages/FormationCorrelation';
import { RiskAnalytics } from './pages/RiskAnalytics';
import { WellExplorer } from './pages/WellExplorer';
import { DocumentIntelligence } from './pages/DocumentIntelligence';
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
            {/* 1. ENGINEER HOMEPAGE: MY ACTIVE WELLS */}
            <Route path="/" element={<MyWells />} />

            {/* 2. DEDICATED WELL WORKSPACE (4 TABS) */}
            <Route path="/workspace" element={<WellWorkspace />} />
            <Route path="/workspace/:wellId" element={<WellWorkspace />} />

            {/* 3. PLAN NEW WELL (3-STEP LOCATION INTELLIGENCE) */}
            <Route path="/plan" element={<PlanWell />} />
            <Route path="/plan/brief" element={<EngineeringBriefPage />} />

            {/* 4. SCOPED DECISION ALERTS */}
            <Route path="/alerts" element={<DecisionAlerts />} />

            {/* 5. CONTEXT-AWARE AI ASSISTANT */}
            <Route path="/assistant" element={<AIAssistant />} />

            {/* SECONDARY & TECHNICAL TOOLS */}
            <Route path="/map" element={<OffsetMap />} />
            <Route path="/correlation" element={<FormationCorrelation />} />
            <Route path="/risk" element={<RiskAnalytics />} />
            <Route path="/wells" element={<WellExplorer />} />
            <Route path="/documents" element={<DocumentIntelligence />} />
            <Route path="/admin" element={<AdminGovernance />} />

            {/* Legacy redirects */}
            <Route path="/command-center" element={<Navigate to="/" replace />} />
            <Route path="/live" element={<Navigate to="/workspace" replace />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
