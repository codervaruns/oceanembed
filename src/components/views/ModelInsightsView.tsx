// Model Insights & 256-D Latent Architecture Inspector
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React, { useState, useEffect } from 'react';
import { useOcean } from '../../context/OceanContext';
import { WaterMassCluster, AttentionMapData } from '../../types/ocean';
import { oceanDataManager } from '../../services/data/oceanDataProvider';
import {
  Cpu,
  Layers,
  Sparkles,
  BarChart3,
  Network,
  Compass,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Sliders,
  Activity,
  GitCommit
} from 'lucide-react';

export const ModelInsightsView: React.FC = () => {
  const { prediction, selectedLocation, theme } = useOcean();
  const [clusters, setClusters] = useState<WaterMassCluster[]>([]);
  const [attentionData, setAttentionData] = useState<AttentionMapData | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<WaterMassCluster | null>(null);
  const [selectedDepthQuery, setSelectedDepthQuery] = useState<number>(100);

  useEffect(() => {
    const fetchData = async () => {
      const provider = oceanDataManager.getProvider();
      const cls = await provider.getWaterMassClusters();
      setClusters(cls);
      setSelectedCluster(cls[0]);
      const attn = await provider.getAttentionData();
      setAttentionData(attn);
    };
    fetchData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      
      {/* Top Architecture Overview Banner */}
      <div className="card-elevated" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={20} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                OceanEmbed Model Architecture &amp; Latent Representation
              </h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Self-supervised multimodal spatio-temporal encoder mapping surface boundary dynamics into a continuous 256-D latent ocean space.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Latent Dimension</span>
              <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>256-D</div>
            </div>
            <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Context Window</span>
              <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-blue)' }}>9×9 × 31d</div>
            </div>
            <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Attention Heads</span>
              <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-purple)' }}>8 Heads</div>
            </div>
            <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Parameters</span>
              <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>14.8M</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 256-D Latent Space Projection + Attention & 8-Head Specializations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
        gap: '16px'
      }}>
        
        {/* Left Column: 256-D Latent Space Projection (t-SNE / PCA clusters) */}
        <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Network size={16} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                256-D Latent Embedding Space (t-SNE Projection)
              </h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Clusters correspond to distinct physical water masses
            </span>
          </div>

          {/* Interactive 2D t-SNE Scatter Canvas */}
          <div style={{
            position: 'relative',
            height: '300px',
            background: 'var(--bg-input)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg viewBox="-60 -60 120 120" style={{ width: '100%', height: '100%' }}>
              {/* Axes */}
              <line x1="-55" y1="0" x2="55" y2="0" stroke="var(--chart-grid)" strokeWidth="0.8" strokeDasharray="2,2" />
              <line x1="0" y1="-55" x2="0" y2="55" stroke="var(--chart-grid)" strokeWidth="0.8" strokeDasharray="2,2" />
              <text x="50" y="-3" fontSize="3.8" fill="var(--text-muted)" textAnchor="end" fontFamily="JetBrains Mono">Latent Dim 1</text>
              <text x="3" y="-50" fontSize="3.8" fill="var(--text-muted)" textAnchor="start" fontFamily="JetBrains Mono">Latent Dim 2</text>

              {/* Water Mass Clusters */}
              {clusters.map((c) => {
                const isSelected = selectedCluster?.id === c.id;
                return (
                  <g
                    key={c.id}
                    onClick={() => setSelectedCluster(c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={c.tsneX}
                      cy={c.tsneY}
                      r={isSelected ? 16 : 12}
                      fill={c.color}
                      opacity={isSelected ? 0.35 : 0.18}
                    />
                    <circle
                      cx={c.tsneX}
                      cy={c.tsneY}
                      r={isSelected ? 4.5 : 3.5}
                      fill={c.color}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 1.5 : 0.8}
                    />
                    <text
                      x={c.tsneX}
                      y={c.tsneY + (c.tsneY > 0 ? 12 : -10)}
                      fontSize="3.6"
                      fontFamily="Inter"
                      fontWeight="600"
                      fill={c.color}
                      textAnchor="middle"
                    >
                      {c.name.split('(')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Current Selected Location Latent Marker */}
              {prediction && (
                <g>
                  <circle
                    cx={15}
                    cy={-10}
                    r="5"
                    fill="#00f2fe"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x="15"
                    y="-18"
                    fontSize="3.8"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    fill="#00f2fe"
                    textAnchor="middle"
                  >
                    Target ({selectedLocation.lat}°N, {selectedLocation.lon}°E)
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Selected Cluster Details */}
          {selectedCluster && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'var(--bg-surface)', border: `1px solid ${selectedCluster.color}40` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.82rem', color: selectedCluster.color }}>
                  {selectedCluster.name}
                </strong>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Mean Salinity: {selectedCluster.salinityMean} PSU | Temp: {selectedCluster.tempMean}°C | σ_θ: {selectedCluster.densityMean} kg/m³
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                {selectedCluster.description}
              </p>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                <strong>Physical Origin:</strong> {selectedCluster.physicalOrigin}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Multi-Head Attention Specializations & Depth Cross-Attention */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* 8-Head Transformer Attention Specializations */}
          <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="var(--accent-purple)" />
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>
                8-Head Multi-Modal Transformer Self-Attention
              </h3>
            </div>
            
            {attentionData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {attentionData.attentionHeadActivations.map((h) => (
                  <div key={h.headIndex} style={{ padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '0.68rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{h.name}</div>
                    <div style={{ color: 'var(--accent-cyan)' }}>{h.specialization}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>Feature: {h.dominantFeature}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Depth-Aware Cross-Attention Query Matrix */}
          <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} color="var(--accent-blue)" />
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>
                  Depth-Query Cross-Attention Decoder
                </h3>
              </div>
              <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                Query: z = {selectedDepthQuery}m
              </span>
            </div>

            {/* Depth Selector Pills */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[0, 50, 100, 150, 300, 500, 1000].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDepthQuery(d)}
                  className={`nav-tab ${selectedDepthQuery === d ? 'active' : ''}`}
                  style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                >
                  {d}m
                </button>
              ))}
            </div>

            {/* Attention Distribution for this Depth */}
            <div style={{ padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {selectedDepthQuery === 0 && 'Surface (0m): Heavy attention on SST (72%) for mixed layer thermal boundary condition.'}
                {selectedDepthQuery === 50 && 'Upper Stratification (50m): Balanced attention between SST (44%), SSS (22%), and SLA (20%).'}
                {selectedDepthQuery >= 100 && selectedDepthQuery <= 200 && 'Thermocline Core (100-200m): SLA dominates (42%), capturing baroclinic isotherm displacement.'}
                {selectedDepthQuery >= 300 && 'Deep Ocean (300-1000m): SLA & geostrophic currents dominate (55%), as direct SST thermal influence decays.'}
              </div>
              <div style={{ display: 'flex', gap: '4px', height: '14px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: selectedDepthQuery === 0 ? '72%' : selectedDepthQuery === 50 ? '44%' : '14%', background: '#ef4444' }} title="SST" />
                <div style={{ width: selectedDepthQuery === 0 ? '12%' : selectedDepthQuery === 50 ? '22%' : '14%', background: '#06b6d4' }} title="SSS" />
                <div style={{ width: selectedDepthQuery === 0 ? '8%' : selectedDepthQuery === 50 ? '20%' : '48%', background: '#38bdf8' }} title="SLA" />
                <div style={{ width: '12%', background: '#10b981' }} title="Currents" />
                <div style={{ width: '10%', background: '#f59e0b' }} title="Winds" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span style={{ color: '#ef4444' }}>■ SST</span>
                <span style={{ color: '#06b6d4' }}>■ SSS</span>
                <span style={{ color: '#38bdf8' }}>■ SLA</span>
                <span style={{ color: '#10b981' }}>■ Currents</span>
                <span style={{ color: '#f59e0b' }}>■ Winds</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
