// Integrated Full-Viewport Ocean Command Center View
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { NorthIndianOceanMap } from '../map/NorthIndianOceanMap';
import { SurfaceVariablesStrip } from '../surface/SurfaceVariablesStrip';
import { VerticalDepthElevator } from '../depth/VerticalDepthElevator';
import { SubsurfaceProfileChart } from '../profile/SubsurfaceProfileChart';
import { ModelPipelineModal } from '../model/ModelPipelineModal';

export const IntegratedCommandView: React.FC = () => {
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '62px',
      paddingBottom: '38px'
    }}>
      {/* Central Spatial Map Canvas & Instruments */}
      <div style={{
        flex: 1,
        width: '100%',
        height: '100%',
        padding: '8px 14px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.45fr) auto minmax(0, 1.05fr)',
        gap: '12px',
        alignItems: 'stretch'
      }}>
        
        {/* Left Column: Spatial Map & 7-Variable Strip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', minHeight: 0 }}>
          <SurfaceVariablesStrip />
          <div style={{ flex: 1, minHeight: 0 }}>
            <NorthIndianOceanMap />
          </div>
        </div>

        {/* Center Vertical Depth Elevator ("Dive Controller") */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <VerticalDepthElevator />
        </div>

        {/* Right Column: Subsurface Physical CTD & Acoustic Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <SubsurfaceProfileChart />
        </div>

      </div>

      {/* Model Neural Pipeline Modal (Triggered on Run OceanEmbed) */}
      <ModelPipelineModal />
    </div>
  );
};
