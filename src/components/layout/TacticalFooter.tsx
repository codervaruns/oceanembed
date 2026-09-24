// Tactical Bottom Telemetry Bar
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { useOcean } from '../../context/OceanContext';
import { STANDARD_DEPTH_LEVELS } from '../../types/ocean';
import {
  Anchor,
  Cpu,
  Layers,
  Flame,
  ShieldCheck,
  Activity,
  Zap,
  TrendingDown
} from 'lucide-react';

export const TacticalFooter: React.FC = () => {
  const {
    selectedLocation,
    activeDepth,
    prediction,
    dataSourceMode,
    isLiveConnected
  } = useOcean();

  const currentTemp = prediction && prediction.temperatures
    ? prediction.temperatures[STANDARD_DEPTH_LEVELS.indexOf(activeDepth)]
    : '--';

  const currentUnc = prediction && prediction.uncertainties
    ? prediction.uncertainties[STANDARD_DEPTH_LEVELS.indexOf(activeDepth)]
    : '--';

  return (
    <footer
      className="hud-panel"
      style={{
        position: 'absolute',
        bottom: '10px',
        left: '14px',
        right: '14px',
        zIndex: 50,
        padding: '5px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.74rem'
      }}
    >
      {/* Left: Seafloor Bathymetry & Active Depth Stratum */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Anchor size={12} color="var(--accent-cyan)" />
          <span style={{ color: 'var(--text-muted)' }}>Seafloor:</span>
          <strong className="mono" style={{ color: 'var(--text-primary)' }}>{selectedLocation.bathymetryDepth}m</strong>
        </div>

        <span style={{ color: 'var(--border-subtle)' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Layers size={12} color="var(--accent-blue)" />
          <span style={{ color: 'var(--text-muted)' }}>Depth Stratum ({activeDepth}m):</span>
          <strong className="mono" style={{ color: 'var(--accent-cyan)' }}>{currentTemp}°C</strong>
          <span style={{ color: 'var(--text-muted)' }}>±</span>
          <strong className="mono" style={{ color: 'var(--accent-purple)' }}>{currentUnc}°C</strong>
        </div>
      </div>

      {/* Center: Physical Oceanographic Stratification & TCHP Metrics */}
      {prediction && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>MLD:</span>
            <strong className="mono" style={{ color: 'var(--accent-emerald)' }}>{prediction.mld}m</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Barrier BLT:</span>
            <strong className="mono" style={{ color: 'var(--accent-cyan)' }}>{prediction.blt}m</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Thermocline D20:</span>
            <strong className="mono" style={{ color: 'var(--accent-amber)' }}>{prediction.d20}m</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={12} color="var(--accent-rose)" />
            <span style={{ color: 'var(--text-muted)' }}>TCHP:</span>
            <strong className="mono" style={{ color: 'var(--accent-rose)' }}>{prediction.tchp} kJ/cm²</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>OHC₃₀₀:</span>
            <strong className="mono" style={{ color: 'var(--accent-purple)' }}>{prediction.uohc300} GJ/m²</strong>
          </div>
        </div>
      )}

      {/* Right: Latent Embedding & Neural Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Cpu size={12} color="var(--accent-emerald)" />
          <span style={{ color: 'var(--text-muted)' }}>Latent State:</span>
          <span className="mono" style={{ color: 'var(--accent-emerald)', fontSize: '0.7rem' }}>
            256-D Unit Norm (42ms)
          </span>
        </div>

        <span style={{ color: 'var(--border-subtle)' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            padding: '1px 6px',
            borderRadius: '4px',
            background: dataSourceMode === 'demo' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: dataSourceMode === 'demo' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
            fontWeight: 600,
            fontSize: '0.68rem'
          }}>
            {dataSourceMode === 'demo' ? 'Curated 0.25° Dataset' : 'Live PyTorch Service'}
          </span>
        </div>
      </div>
    </footer>
  );
};
