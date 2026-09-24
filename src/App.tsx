// OceanEmbed Main Application Shell
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { OceanProvider, useOcean } from './context/OceanContext';
import { Navbar } from './components/layout/Navbar';
import { StatusBar } from './components/layout/StatusBar';
import { OceanDashboardView } from './components/views/OceanDashboardView';
import { ModelInsightsView } from './components/views/ModelInsightsView';
import { ArgoValidationView } from './components/views/ArgoValidationView';
import { DisasterStateView } from './components/views/DisasterStateView';
import { DataProvenanceView } from './components/views/DataProvenanceView';
import { GuidedTourOverlay } from './components/tour/GuidedTourOverlay';

const MainContent: React.FC = () => {
  const { activeTab } = useOcean();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Platform Header */}
      <Navbar />

      {/* Dynamic Main View */}
      <main style={{ flex: 1, paddingBottom: '24px' }}>
        {activeTab === 'map' && <OceanDashboardView />}
        {activeTab === 'insights' && <ModelInsightsView />}
        {activeTab === 'argo' && <ArgoValidationView />}
        {activeTab === 'disaster' && <DisasterStateView />}
        {activeTab === 'provenance' && <DataProvenanceView />}
      </main>

      {/* Guided Tour HUD Overlay */}
      <GuidedTourOverlay />

      {/* Bottom Telemetry & Status Bar */}
      <StatusBar />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <OceanProvider>
      <MainContent />
    </OceanProvider>
  );
};

export default App;
