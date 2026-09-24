// Disaster Management & Downstream Ocean State Intelligence View
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React, { useState, useEffect } from 'react';
import { useOcean } from '../../context/OceanContext';
import { CycloneCaseStudy, UpwellingZone } from '../../types/ocean';
import { oceanDataManager } from '../../services/data/oceanDataProvider';
import {
  AlertTriangle,
  Flame,
  Wind,
  Waves,
  Fish,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Activity,
  Zap
} from 'lucide-react';

export const DisasterStateView: React.FC = () => {
  const { prediction, selectedLocation } = useOcean();
  const [caseStudies, setCaseStudies] = useState<CycloneCaseStudy[]>([]);
  const [upwellingZones, setUpwellingZones] = useState<UpwellingZone[]>([]);
  const [selectedCyclone, setSelectedCyclone] = useState<CycloneCaseStudy | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const provider = oceanDataManager.getProvider();
      const cases = await provider.getDisasterCaseStudies();
      const upw = await provider.getUpwellingZones();
      setCaseStudies(cases);
      setSelectedCyclone(cases[0]);
      setUpwellingZones(upw);
    };
    fetchData();
  }, []);

  const currentTchp = prediction?.tchp || 78.4;
  const currentD26 = prediction?.d26 || 68;

  const getTchpRiskLevel = (val: number) => {
    if (val >= 80) return { level: 'High Rapid Intensification Risk', color: 'var(--accent-rose)', bg: 'rgba(239, 68, 68, 0.15)' };
    if (val >= 50) return { level: 'Moderate Ocean Heat Potential', color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.15)' };
    return { level: 'Low Ocean Thermal Energy', color: 'var(--accent-cyan)', bg: 'rgba(0, 242, 254, 0.15)' };
  };

  const risk = getTchpRiskLevel(currentTchp);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      
      {/* Header Banner */}
      <div className="card-elevated" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="var(--accent-rose)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Disaster Intelligence: Cyclone Heat Potential & Thermal Fronts
              </h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Transforming reconstructed 3D thermal stratification into actionable early-warning metrics for tropical cyclones and marine ecosystems.
            </p>
          </div>

          {/* Active Location TCHP Telemetry Pill */}
          <div style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: risk.bg,
            border: `1px solid ${risk.color}50`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Target TCHP</span>
              <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: risk.color }}>
                {currentTchp} <span style={{ fontSize: '0.75rem' }}>kJ/cm²</span>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '10px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>D26 Isotherm</span>
              <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentD26} m
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Cyclone Heat Potential Calculator + Cyclone Case Studies */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1.1fr)',
        gap: '16px'
      }}>
        
        {/* Left Column: Tropical Cyclone Heat Potential (TCHP) & Physics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={16} color="var(--accent-rose)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                Tropical Cyclone Heat Potential (TCHP) Diagnostic
              </h3>
            </div>
            
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0 }}>
              While Sea Surface Temperature (SST) only reflects the top skin layer, **TCHP measures the total integrated heat content above the 26°C isotherm ($D_{26}$)**. High TCHP prevents cyclone-induced self-cooling via cold-water upwelling, enabling rapid storm intensification.
            </p>

            {/* Mathematical Formula Card */}
            <div style={{
              background: 'var(--bg-surface)',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem'
            }}>
              <div className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '4px' }}>
                TCHP = ρ · Cp · ∫ [0 to D26] (T(z) - 26°C) dz
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Where ρ = 1025 kg/m³ (seawater density), Cp = 3993 J/(kg·K) (specific heat), D26 is depth of 26°C isotherm.
              </div>
            </div>

            {/* Risk Gauge Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>0 kJ/cm² (Low)</span>
                <strong style={{ color: risk.color }}>{risk.level}</strong>
                <span style={{ color: 'var(--text-muted)' }}>140 kJ/cm² (Extreme)</span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-input)', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                <div
                  style={{
                    width: `${Math.min(100, (currentTchp / 140) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00f2fe 0%, #f59e0b 50%, #ef4444 100%)',
                    borderRadius: '5px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Coastal Upwelling & Potential Fishing Zones (PFZ) */}
          <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Fish size={16} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                Coastal Upwelling & Potential Fishing Zones (PFZ)
              </h3>
            </div>
            
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
              Detecting coastal thermocline shoaling where cold, nutrient-rich subsurface water ascends into the euphotic zone, creating prime fishing grounds:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upwellingZones.map((z) => (
                <div key={z.id} style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{z.name}</strong>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--accent-emerald)',
                      fontWeight: 600
                    }}>
                      {z.pfzStatus}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }} className="mono">
                    <span>Gradient: {z.verticalGradient}°C/50m</span>
                    <span>Thermocline: {z.thermoclineDepth}m</span>
                    <span>Chlorophyll: {z.chlorophyllProxy}</span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {z.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Historical Cyclone Rapid Intensification Case Studies */}
        <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wind size={16} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
              Tropical Cyclone Subsurface Heat Interaction Case Studies
            </h3>
          </div>

          {/* Cyclone Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {caseStudies.map((c) => {
              const isSelected = selectedCyclone?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCyclone(c)}
                  className={`nav-tab ${isSelected ? 'active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center', padding: '6px 10px', fontSize: '0.75rem' }}
                >
                  {c.cycloneName.split(' ')[c.cycloneName.split(' ').length - 1]} ({c.year})
                </button>
              );
            })}
          </div>

          {/* Selected Cyclone Details */}
          {selectedCyclone && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    {selectedCyclone.cycloneName}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
                    {selectedCyclone.category} &middot; {selectedCyclone.basin}
                  </span>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {selectedCyclone.description}
                </p>
              </div>

              {/* Pre vs Post Storm Thermal Wake Profile Comparison */}
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Pre-Storm vs Post-Storm Reconstructed Profile (0–200m)
                  </span>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.65rem' }}>
                    <span style={{ color: '#ef4444' }}>■ Pre-Storm (High TCHP)</span>
                    <span style={{ color: '#38bdf8' }}>■ Post-Storm Wake</span>
                  </div>
                </div>

                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse', textAlign: 'left' }} className="mono">
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '4px 6px' }}>Depth</th>
                        <th style={{ padding: '4px 6px' }}>Pre-Storm Temp</th>
                        <th style={{ padding: '4px 6px' }}>Post-Storm Temp</th>
                        <th style={{ padding: '4px 6px' }}>Cooling Wake ($\Delta T$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCyclone.preStormThermalProfile.depths.slice(0, 8).map((d, idx) => {
                        const preT = selectedCyclone.preStormThermalProfile.temperatures[idx];
                        const postT = selectedCyclone.postStormThermalProfile.temperatures[idx];
                        const drop = Math.round((preT - postT) * 10) / 10;

                        return (
                          <tr key={d} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '4px 6px' }}>{d} m</td>
                            <td style={{ padding: '4px 6px', color: '#ef4444', fontWeight: 600 }}>{preT.toFixed(1)}°C</td>
                            <td style={{ padding: '4px 6px', color: '#38bdf8', fontWeight: 600 }}>{postT.toFixed(1)}°C</td>
                            <td style={{ padding: '4px 6px', color: drop > 1.5 ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>
                              -{drop.toFixed(1)}°C
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Subsurface Heat Depletion Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.72rem' }}>
                  <span>SST Cooling Wake: <strong className="mono" style={{ color: 'var(--accent-rose)' }}>-{selectedCyclone.sstCoolingWake}°C</strong></span>
                  <span>Heat Depleted: <strong className="mono" style={{ color: 'var(--accent-amber)' }}>{selectedCyclone.subsurfaceHeatDepletion} kJ/cm²</strong></span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
