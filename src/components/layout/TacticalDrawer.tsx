// Tactical Slide-Over Drawer Shell
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { useOcean } from '../../context/OceanContext';
import { ModelInsightsView } from '../views/ModelInsightsView';
import { ArgoValidationView } from '../views/ArgoValidationView';
import { DisasterStateView } from '../views/DisasterStateView';
import { DataProvenanceView } from '../views/DataProvenanceView';
import { X, Cpu, CheckCircle2, Flame, Database } from 'lucide-react';

export const TacticalDrawer: React.FC = () => {
  const { activeDrawer, setActiveDrawer } = useOcean();

  if (activeDrawer === 'none') return null;

  const getDrawerHeader = () => {
    switch (activeDrawer) {
      case 'insights':
        return {
          title: 'Model Architecture & 256-D Latent Explorer',
          icon: <Cpu size={18} color="var(--accent-cyan)" />
        };
      case 'argo':
        return {
          title: 'In-Situ ARGO Float Validation Benchmark',
          icon: <CheckCircle2 size={18} color="var(--accent-emerald)" />
        };
      case 'disaster':
        return {
          title: 'Tropical Cyclone Heat Potential & Rapid Intensification',
          icon: <Flame size={18} color="var(--accent-rose)" />
        };
      case 'provenance':
        return {
          title: 'Data Provenance, Satellite Streams & Methodology',
          icon: <Database size={18} color="var(--accent-purple)" />
        };
      default:
        return { title: '', icon: null };
    }
  };

  const header = getDrawerHeader();

  return (
    <div className="drawer-backdrop" onClick={() => setActiveDrawer('none')}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {header.icon}
            <h2 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {header.title}
            </h2>
          </div>

          <button
            onClick={() => setActiveDrawer('none')}
            className="btn-tactical-secondary"
            style={{ padding: '4px 8px' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Drawer Body Content */}
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
          {activeDrawer === 'insights' && <ModelInsightsView />}
          {activeDrawer === 'argo' && <ArgoValidationView />}
          {activeDrawer === 'disaster' && <DisasterStateView />}
          {activeDrawer === 'provenance' && <DataProvenanceView />}
        </div>
      </div>
    </div>
  );
};
