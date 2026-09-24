// Main Ocean Intelligence Dashboard View (Central Screen)
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { NorthIndianOceanMap } from '../map/NorthIndianOceanMap';
import { SurfaceVariablesStrip } from '../surface/SurfaceVariablesStrip';
import { DepthSlider } from '../depth/DepthSlider';
import { SubsurfaceProfileChart } from '../profile/SubsurfaceProfileChart';
import { ModelPipelineModal } from '../model/ModelPipelineModal';

export const OceanDashboardView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      
      {/* 7 Surface Satellite Ingestion Variable Strip */}
      <SurfaceVariablesStrip />

      {/* Main Grid: Left Map + Right Subsurface Profile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
        gap: '14px',
        alignItems: 'stretch'
      }}>
        
        {/* Left Column: Interactive Map + Depth Controller */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <NorthIndianOceanMap />
          <DepthSlider />
        </div>

        {/* Right Column: Subsurface Profile (0-1000m) + Uncertainty Band */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SubsurfaceProfileChart />
        </div>

      </div>

      {/* Neural Pipeline Modal (triggered on Run OceanEmbed) */}
      <ModelPipelineModal />

    </div>
  );
};
