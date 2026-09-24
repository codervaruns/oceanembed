// Platform Bottom Status & Telemetry Bar
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { useOcean } from '../../context/OceanContext';
import { STANDARD_DEPTH_LEVELS } from '../../types/ocean';
import { MapPin, ShieldAlert, Cpu, Activity, Layers } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { selectedLocation, activeDepth, prediction, dataSourceMode, isLiveConnected } = useOcean();

  const currentTemp = prediction && prediction.temperatures
    ? prediction.temperatures[STANDARD_DEPTH_LEVELS.indexOf(activeDepth)]
    : '--';
  
  const currentUnc = prediction && prediction.uncertainties
    ? prediction.uncertainties[STANDARD_DEPTH_LEVELS.indexOf(activeDepth)]
    : '--';

  return (
    <footer className="glass-panel" style={{
      borderTop: '1px solid var(--border-subtle)',
      padding: '6px 20px',
      fontSize: '0.74rem',
      color: 'var(--text-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      {/* Left Info: Location & Bathymetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={13} color="var(--accent-cyan)" />
          <span>Region:</span>
          <strong style={{ color: 'var(--text-primary)' }}>{selectedLocation.regionName}</strong>
          <span className="mono" style={{ color: 'var(--text-muted)' }}>({selectedLocation.subRegion})</span>
        </div>
        <span style={{ color: 'var(--border-subtle)' }}>|</span>
        <div>
          <span>Seafloor Bathymetry:</span>{' '}
          <strong className="mono" style={{ color: 'var(--text-primary)' }}>{selectedLocation.bathymetryDepth} m</strong>
        </div>
      </div>

      {/* Center Info: Active Depth Slice Thermal Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={13} color="var(--accent-blue)" />
          <span>Depth Slice ({activeDepth}m):</span>
          <strong className="mono" style={{ color: 'var(--accent-cyan)' }}>{currentTemp}°C</strong>
          <span style={{ color: 'var(--text-muted)' }}>±</span>
          <span className="mono" style={{ color: 'var(--accent-purple)' }}>{currentUnc}°C</span>
        </div>
        <span style={{ color: 'var(--border-subtle)' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={13} color="var(--accent-emerald)" />
          <span>Latent Vector:</span>
          <span className="mono" style={{ color: 'var(--accent-emerald)', fontSize: '0.7rem' }}>
            256-D Encoded
          </span>
        </div>
      </div>

      {/* Right Info: Data Source & Resolution Provenance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={13} color={isLiveConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
          <span>Provider:</span>
          <span style={{
            padding: '1px 6px',
            borderRadius: '4px',
            background: dataSourceMode === 'demo' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: dataSourceMode === 'demo' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
            fontWeight: 600,
            fontSize: '0.7rem'
          }}>
            {dataSourceMode === 'demo' ? 'Illustrative Demo Dataset (0.25°)' : 'Live PyTorch Model (0.25°)'}
          </span>
        </div>
      </div>
    </footer>
  );
};
