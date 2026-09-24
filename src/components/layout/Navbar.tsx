// Top Navigation & Platform Header Bar
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { useOcean } from '../../context/OceanContext';
import { ActiveTab } from '../../types/ocean';
import {
  Compass,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Database,
  Sun,
  Moon,
  Play,
  Waves,
  Layers,
  Activity,
  Server
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedLocation,
    activeDepth,
    theme,
    toggleTheme,
    dataSourceMode,
    setDataSourceMode,
    isLiveConnected,
    startTour,
    isTourActive
  } = useOcean();

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'map', label: 'Ocean Map', icon: <Compass size={16} /> },
    { id: 'insights', label: 'Model Insights', icon: <Cpu size={16} /> },
    { id: 'argo', label: 'ARGO Benchmark', icon: <CheckCircle2 size={16} /> },
    { id: 'disaster', label: 'Disaster State (TCHP)', icon: <AlertTriangle size={16} /> },
    { id: 'provenance', label: 'Data Provenance', icon: <Database size={16} /> }
  ];

  return (
    <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Brand & SIH Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #1e3a8a 100%)',
            color: '#ffffff',
            boxShadow: '0 0 16px rgba(0, 242, 254, 0.35)'
          }}>
            <Waves size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #00f2fe, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                OCEANEMBED
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(0, 242, 254, 0.12)',
                color: 'var(--text-accent)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                textTransform: 'uppercase'
              }}>
                SIH26066
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              Satellite 3D Subsurface Ocean Intelligence &middot; North Indian Ocean
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              title={`View ${tab.label}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Status / Quick Actions & Tour Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Active Target Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface)',
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem'
          }}>
            <Layers size={14} color="var(--accent-cyan)" />
            <span style={{ color: 'var(--text-secondary)' }}>Depth:</span>
            <strong className="mono" style={{ color: 'var(--accent-cyan)' }}>{activeDepth}m</strong>
            <span style={{ color: 'var(--border-active)' }}>|</span>
            <span className="mono" style={{ color: 'var(--text-primary)' }}>
              {selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lon.toFixed(2)}°E
            </span>
          </div>

          {/* Model Mode Selector (Demo vs Live FastAPI) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setDataSourceMode(dataSourceMode === 'demo' ? 'fastapi' : 'demo')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 10px' }}
              title="Toggle between Curated Demo Dataset and Live FastAPI ML Service"
            >
              <Server size={13} color={isLiveConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
              <span>{dataSourceMode === 'demo' ? 'Demo Mode' : 'Live ML API'}</span>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isLiveConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)'
              }} />
            </button>
          </div>

          {/* Guided Demo Button */}
          <button
            onClick={startTour}
            className="btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              opacity: isTourActive ? 0.7 : 1
            }}
            title="Start automated 75-second SIH Jury Presentation Walkthrough"
          >
            <Play size={13} fill="#040914" />
            <span>Guided Pitch</span>
          </button>

          {/* Dual Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{ padding: '6px 10px', borderRadius: '6px' }}
            title={`Switch to ${theme === 'dark' ? 'Light Laboratory' : 'Dark Abyssal'} Theme`}
          >
            {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#0284c7" />}
          </button>

        </div>
      </div>
    </header>
  );
};
