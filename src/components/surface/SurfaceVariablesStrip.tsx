// 7 Surface Satellite Variable Multi-Modal Ingestion Strip
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { useOcean } from '../../context/OceanContext';
import { SurfaceVariableMetadata } from '../../types/ocean';
import {
  Thermometer,
  Droplets,
  Waves,
  Wind,
  Compass,
  Zap,
  CheckSquare,
  Square,
  Sparkles,
  Info
} from 'lucide-react';

const SURFACE_METADATA: SurfaceVariableMetadata[] = [
  {
    id: 'sst',
    name: 'Sea Surface Temperature',
    symbol: 'SST',
    unit: '°C',
    description: 'Direct thermal boundary condition of the upper ocean mixed layer.',
    satelliteSource: 'OSTIA / Sentinel-3',
    physicalRole: 'Sets surface heat flux & mixed layer thermal boundary.',
    color: '#ef4444',
    validRange: [24.0, 32.5]
  },
  {
    id: 'sss',
    name: 'Sea Surface Salinity',
    symbol: 'SSS',
    unit: 'PSU',
    description: 'Halosteric density driver controlling barrier layer formation.',
    satelliteSource: 'SMOS / SMAP',
    physicalRole: 'Drives haline stratification (critical in BoB river plume).',
    color: '#06b6d4',
    validRange: [30.0, 37.0]
  },
  {
    id: 'sla',
    name: 'Sea Level Anomaly',
    symbol: 'SLA / SSH',
    unit: 'cm',
    description: 'Baroclinic proxy for dynamic thermocline depth displacement.',
    satelliteSource: 'DUACS / Jason-3 & SWOT',
    physicalRole: 'Positive SLA indicates deep thermocline; negative indicates shoaling.',
    color: '#38bdf8',
    validRange: [-25.0, 25.0]
  },
  {
    id: 'u_curr',
    name: 'Zonal Surface Current',
    symbol: 'U_curr',
    unit: 'm/s',
    description: 'East-west geostrophic and Ekman surface advection.',
    satelliteSource: 'OSCAR / Altimetry',
    physicalRole: 'Transports heat horizontally across basin boundaries.',
    color: '#10b981',
    validRange: [-1.5, 1.5]
  },
  {
    id: 'v_curr',
    name: 'Meridional Surface Current',
    symbol: 'V_curr',
    unit: 'm/s',
    description: 'North-south surface circulation and coastal boundary currents.',
    satelliteSource: 'OSCAR / Altimetry',
    physicalRole: 'Transports equatorial warm water into Arabian Sea and BoB.',
    color: '#10b981',
    validRange: [-1.5, 1.5]
  },
  {
    id: 'u_wind',
    name: 'Zonal Wind Stress',
    symbol: 'U_wind',
    unit: 'm/s',
    description: 'Zonal atmospheric forcing driving surface divergence and Ekman drift.',
    satelliteSource: 'ERA5 / CCMP',
    physicalRole: 'Monsoon zonal wind forcing driving coastal upwelling.',
    color: '#f59e0b',
    validRange: [-15.0, 15.0]
  },
  {
    id: 'v_wind',
    name: 'Meridional Wind Stress',
    symbol: 'V_wind',
    unit: 'm/s',
    description: 'Meridional atmospheric forcing driving Findlater Jet and monsoon dynamics.',
    satelliteSource: 'ERA5 / CCMP',
    physicalRole: 'Drives open-ocean Ekman suction and thermocline pumping.',
    color: '#f59e0b',
    validRange: [-15.0, 15.0]
  }
];

export const SurfaceVariablesStrip: React.FC = () => {
  const {
    surfaceVariables,
    surfaceToggles,
    toggleSurfaceVariable,
    triggerInference,
    isInferenceRunning
  } = useOcean();

  const getVariableValue = (id: string) => {
    if (!surfaceVariables) return '--';
    switch (id) {
      case 'sst': return surfaceVariables.sst.toFixed(1);
      case 'sss': return surfaceVariables.sss.toFixed(1);
      case 'sla': return `${surfaceVariables.sla > 0 ? '+' : ''}${surfaceVariables.sla.toFixed(1)}`;
      case 'u_curr': return `${surfaceVariables.uCurrent > 0 ? '+' : ''}${surfaceVariables.uCurrent.toFixed(2)}`;
      case 'v_curr': return `${surfaceVariables.vCurrent > 0 ? '+' : ''}${surfaceVariables.vCurrent.toFixed(2)}`;
      case 'u_wind': return `${surfaceVariables.uWind > 0 ? '+' : ''}${surfaceVariables.uWind.toFixed(1)}`;
      case 'v_wind': return `${surfaceVariables.vWind > 0 ? '+' : ''}${surfaceVariables.vWind.toFixed(1)}`;
      default: return '--';
    }
  };

  return (
    <div className="card-elevated" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* Title & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Waves size={15} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>
              7 Surface Satellite Observations
            </h3>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              (9×9 Spatial Patch &times; 31-Day Window)
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Fusing remote sensing variables into a unified 256-D ocean latent space.
          </p>
        </div>

        {/* Inference Action Button */}
        <button
          onClick={triggerInference}
          disabled={isInferenceRunning}
          className="btn-primary"
          style={{
            padding: '7px 16px',
            fontSize: '0.82rem',
            letterSpacing: '0.01em'
          }}
          title="Trigger Spatiotemporal Multimodal Transformer & Reconstruct 0-1000m Subsurface Profile"
        >
          <Zap size={14} fill={isInferenceRunning ? 'none' : '#040914'} />
          <span>{isInferenceRunning ? 'Encoding Latent...' : 'Run OceanEmbed'}</span>
        </button>
      </div>

      {/* 7 Variable Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '8px'
      }}>
        {SURFACE_METADATA.map((v) => {
          const isActive = surfaceToggles[v.id] ?? true;
          const val = getVariableValue(v.id);

          return (
            <div
              key={v.id}
              onClick={() => toggleSurfaceVariable(v.id)}
              className="card-interactive"
              style={{
                padding: '8px 10px',
                opacity: isActive ? 1 : 0.55,
                borderColor: isActive ? 'var(--border-subtle)' : 'transparent',
                background: isActive ? 'var(--bg-surface)' : 'var(--bg-input)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              title={`${v.name} (${v.satelliteSource}): ${v.description}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: v.color }}>
                  {v.symbol}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  {v.unit}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '2px 0' }}>
                <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {val}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {v.unit}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.satelliteSource}
                </span>
                <span style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  {isActive ? <CheckSquare size={11} /> : <Square size={11} />}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
