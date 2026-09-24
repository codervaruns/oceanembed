// Data Lineage, Methodology & Scientific Provenance View
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import {
  Database,
  Satellite,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export const DataProvenanceView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      
      {/* Header Overview Card */}
      <div className="card-elevated" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Database size={20} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
            Data Provenance, Satellite Lineage & Scientific Standards
          </h2>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
          Full documentation of remote sensing ingestion pipelines, in-situ ground-truth standards, training reanalyses, and prototype data assumptions.
        </p>
      </div>

      {/* Main Grid: Satellite Streams + Ground Truth + Methodology */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        
        {/* Card 1: Remote Sensing Surface Streams */}
        <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Satellite size={16} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
              1. Satellite Surface Input Streams
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600 }}>
                <span style={{ color: '#ef4444' }}>SST &middot; Sea Surface Temperature</span>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>0.05° Synoptic</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Operational Sea Surface Temperature and Sea Ice Analysis (OSTIA) / Sentinel-3 SLSTR.
              </div>
            </div>

            <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600 }}>
                <span style={{ color: '#06b6d4' }}>SSS &middot; Sea Surface Salinity</span>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>0.25° Grid</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                ESA SMOS (Soil Moisture and Ocean Salinity) & NASA SMAP radiometer L3/L4 products.
              </div>
            </div>

            <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600 }}>
                <span style={{ color: '#38bdf8' }}>SLA &middot; Sea Level Anomaly</span>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>0.25° Altimetry</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Copernicus DUACS multi-mission gridded altimetry (Jason-3, Sentinel-6, SWOT).
              </div>
            </div>

            <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600 }}>
                <span style={{ color: '#10b981' }}>Currents &middot; U/V Geostrophic</span>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>1/3° Resolution</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                OSCAR (Ocean Surface Current Analysis Real-time) combined geostrophic & Ekman flow.
              </div>
            </div>

            <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600 }}>
                <span style={{ color: '#f59e0b' }}>Winds &middot; U/V Wind Stress</span>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>0.25° ERA5</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                ECMWF ERA5 & Cross-Calibrated Multi-Platform (CCMP) ocean vector wind stress.
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Ground-Truth Validation & Training Reanalyses */}
        <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
              2. In-Situ & Reanalysis Standards
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>
                <span>ARGO Global Data Assembly Centre (GDAC)</span>
                <span className="mono">Passed QC</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Independent in-situ vertical CTD profiles collected by autonomous profiling floats across the North Indian Ocean (INCOIS, JAMSTEC, CSIRO).
              </p>
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                <span>GLORYS12V1 Global Ocean Reanalysis</span>
                <span className="mono">CMEMS 1/12°</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Used for pre-training the multimodal encoder across 1993–2022 to learn baseline climatology and vertical baroclinic modes.
              </p>
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, color: 'var(--accent-purple)' }}>
                <span>RAMA Moored Buoy Array</span>
                <span className="mono">NOAA / INCOIS</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Fixed tropical moored buoy lines providing high-frequency time-series verification of mixed-layer depth and barrier layer shoaling.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Scientific Caveats, Ethics & Operational Protocol */}
        <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={16} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
              3. Scientific Caveats & Credibility Policy
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Prototype Status:</strong>{' '}
              In the current evaluation prototype, spatial fields and 256-D latent clusters are rendered using a curated high-density scientific dataset. All demo indicators are explicitly marked.
            </div>

            <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Physical Reconstruction vs Forecasting:</strong>{' '}
              OceanEmbed reconstructs subsurface thermal structure (0–1000m) from surface observations. It provides Tropical Cyclone Heat Potential (TCHP) diagnostic inputs to operational forecast models, rather than directly predicting cyclone tracks.
            </div>

            <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Uncertainty Propagation:</strong>{' '}
              Reconstruction confidence naturally decreases with depth as surface satellite signals lose direct thermodynamic coupling to abyssal layers.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
