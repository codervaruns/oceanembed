// Tactical Floating Header HUD
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { useOcean, ActiveDrawer } from '../../context/OceanContext';
import {
  Waves,
  Cpu,
  CheckCircle2,
  Flame,
  Database,
  Sun,
  Moon,
  Play,
  Server,
  Layers,
  MapPin,
  Sparkles
} from 'lucide-react';

export const TacticalHeader: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    selectedLocation,
    activeDepth,
    theme,
    toggleTheme,
    dataSourceMode,
    setDataSourceMode,
    isLiveConnected,
    startTour,
    isTourActive,
    setSelectedLocation
  } = useOcean();

  const handleToggleDrawer = (drawer: ActiveDrawer) => {
    setActiveDrawer(activeDrawer === drawer ? 'none' : drawer);
  };

  return (
    <header
      className="hud-panel"
      style={{
        position: 'absolute',
        top: '12px',
        left: '14px',
        right: '14px',
        zIndex: 50,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}
    >
      {/* Brand & Problem Statement Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #00f2fe 0%, #1e3a8a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 0 16px rgba(0, 242, 254, 0.4)'
        }}>
          <Waves size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #00f2fe, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              OCEANEMBED
            </span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '4px',
              background: 'rgba(0, 242, 254, 0.12)',
              color: 'var(--text-accent)',
              border: '1px solid rgba(0, 242, 254, 0.3)'
            }}>
              SIH26066
            </span>
          </div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
            Satellite Subsurface Ocean Intelligence &middot; North Indian Ocean 0.25°
          </p>
        </div>
      </div>

      {/* Target Coordinates & Basin Selector Presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div className="hud-pill mono" style={{ border: '1px solid var(--border-active)' }}>
          <MapPin size={12} color="var(--accent-cyan)" />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lon.toFixed(2)}°E
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            {selectedLocation.regionName}
          </span>
        </div>

        {/* Quick Basin Jumps */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setSelectedLocation(15.0, 68.0)}
            className="btn-tactical-secondary"
            style={{ padding: '3px 8px', fontSize: '0.7rem' }}
          >
            Arabian Sea
          </button>
          <button
            onClick={() => setSelectedLocation(14.5, 88.0)}
            className="btn-tactical-secondary"
            style={{ padding: '3px 8px', fontSize: '0.7rem' }}
          >
            Bay of Bengal
          </button>
          <button
            onClick={() => setSelectedLocation(5.5, 78.0)}
            className="btn-tactical-secondary"
            style={{ padding: '3px 8px', fontSize: '0.7rem' }}
          >
            Equatorial IO
          </button>
        </div>
      </div>

      {/* Slide-Over Drawer Triggers & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => handleToggleDrawer('insights')}
          className={`btn-tactical-secondary ${activeDrawer === 'insights' ? 'active' : ''}`}
          title="Inspect 256-D Latent Space & Multi-Modal Transformer Architecture"
        >
          <Cpu size={13} color="var(--accent-cyan)" />
          <span>Model Architecture</span>
        </button>

        <button
          onClick={() => handleToggleDrawer('argo')}
          className={`btn-tactical-secondary ${activeDrawer === 'argo' ? 'active' : ''}`}
          title="In-Situ ARGO Float Co-Location Validation Benchmark"
        >
          <CheckCircle2 size={13} color="var(--accent-emerald)" />
          <span>ARGO Validation</span>
        </button>

        <button
          onClick={() => handleToggleDrawer('disaster')}
          className={`btn-tactical-secondary ${activeDrawer === 'disaster' ? 'active' : ''}`}
          title="Tropical Cyclone Heat Potential (TCHP) & Rapid Intensification Risk"
        >
          <Flame size={13} color="var(--accent-rose)" />
          <span>Cyclone TCHP</span>
        </button>

        <button
          onClick={() => handleToggleDrawer('provenance')}
          className={`btn-tactical-secondary ${activeDrawer === 'provenance' ? 'active' : ''}`}
          title="Data Provenance & Satellite Lineage"
        >
          <Database size={13} color="var(--accent-purple)" />
          <span>Provenance</span>
        </button>

        <span style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 2px' }} />

        {/* Guided Pitch Demo Tour Launcher */}
        <button
          onClick={startTour}
          className="btn-tactical-primary"
          style={{ padding: '5px 12px', fontSize: '0.76rem' }}
          title="Start automated 75-second SIH Jury Presentation Tour"
        >
          <Play size={12} fill="#020612" />
          <span>Guided Pitch</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-tactical-secondary"
          style={{ padding: '5px 8px' }}
          title={`Switch to ${theme === 'dark' ? 'Light Laboratory' : 'Dark Abyssal'} Theme`}
        >
          {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#0284c7" />}
        </button>
      </div>
    </header>
  );
};
