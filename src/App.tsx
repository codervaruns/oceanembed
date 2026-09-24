// OceanEmbed Application Shell — Spatial Ocean Command Center
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { OceanProvider } from './context/OceanContext';
import { TacticalHeader } from './components/layout/TacticalHeader';
import { TacticalFooter } from './components/layout/TacticalFooter';
import { TacticalDrawer } from './components/layout/TacticalDrawer';
import { IntegratedCommandView } from './components/views/IntegratedCommandView';
import { GuidedTourOverlay } from './components/tour/GuidedTourOverlay';

const MainApp: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--bg-deep)'
    }}>
      {/* Floating Tactical Header HUD */}
      <TacticalHeader />

      {/* Main Full-Viewport Spatial Command Center */}
      <IntegratedCommandView />

      {/* Slide-Over Inspection Drawers */}
      <TacticalDrawer />

      {/* 75-Second Guided Pitch Presentation Overlay */}
      <GuidedTourOverlay />

      {/* Bottom Telemetry & Physical Stratification Footer */}
      <TacticalFooter />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <OceanProvider>
      <MainApp />
    </OceanProvider>
  );
};

export default App;
