// Animated Neural Architecture & 256-D Latent Inference Modal
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React, { useState, useEffect } from 'react';
import { useOcean } from '../../context/OceanContext';
import {
  Cpu,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  ArrowRight,
  Database,
  Eye,
  GitCommit,
  Radio
} from 'lucide-react';

interface StageInfo {
  id: number;
  title: string;
  subtitle: string;
  math: string;
  tensorShape: string;
  description: string;
}

const PIPELINE_STAGES: StageInfo[] = [
  {
    id: 1,
    title: '7 Surface Signals',
    subtitle: 'Remote Sensing Ingestion',
    math: '\\mathbf{X}_t \\in \\mathbb{R}^{7 \\times H \\times W}',
    tensorShape: '(7, 9, 9)',
    description: 'Ingests multi-satellite surface observables (SST, SSS, SLA, U/V currents, U/V winds) over a 0.25° grid patch.'
  },
  {
    id: 2,
    title: 'Spatiotemporal Context',
    subtitle: '31-Day Dynamic Window',
    math: '\\mathbf{X}_{t-30:t} \\in \\mathbb{R}^{7 \\times 9 \\times 9 \\times 31}',
    tensorShape: '(7, 9, 9, 31)',
    description: 'Captures historical memory of surface wind bursts, Rossby waves, and seasonal solar heat flux evolution.'
  },
  {
    id: 3,
    title: 'Multimodal CNN-Transformer',
    subtitle: 'Cross-Variable Self-Attention',
    math: '\\mathbf{H} = \\text{Transformer}(\\text{Conv3D}(\\mathbf{X}))',
    tensorShape: '(Batch, 128, 64)',
    description: 'Learns non-linear baroclinic correlations between sea surface height anomalies and vertical density gradients.'
  },
  {
    id: 4,
    title: '256-D Ocean Embedding',
    subtitle: 'Latent Water-Mass Vector',
    math: '\\mathbf{z}_{\\text{ocean}} \\in \\mathbb{R}^{256}',
    tensorShape: '(256,)',
    description: 'Compact continuous representation of the 3D ocean state, invariant to surface noise and sensor gaps.'
  },
  {
    id: 5,
    title: 'Depth-Aware Decoder',
    subtitle: 'Cross-Attention Depth Query',
    math: '\\hat{T}(z) = \\text{CrossAttn}(q=\\mathbf{e}_z, k,v=\\mathbf{z})',
    tensorShape: '(15, 64)',
    description: 'Queries the 256-D embedding using 15 continuous depth level positional tokens from surface (0m) to abyss (1000m).'
  },
  {
    id: 6,
    title: 'Subsurface Reconstruction',
    subtitle: 'Temp + Uncertainty (±σ)',
    math: '\\hat{T}(z) \\pm 1.96\\hat{\\sigma}(z) \\quad \\forall z \\in \\mathcal{Z}',
    tensorShape: '(15, 2)',
    description: 'Outputs physical temperature profile alongside depth-dependent Bayesian uncertainty bounds.'
  }
];

export const ModelPipelineModal: React.FC = () => {
  const { isPipelineModalOpen, setIsPipelineModalOpen, isInferenceRunning, prediction } = useOcean();
  const [activeStage, setActiveStage] = useState<number>(1);
  const [selectedStageDetail, setSelectedStageDetail] = useState<StageInfo>(PIPELINE_STAGES[0]);

  // Sequential progression during active inference
  useEffect(() => {
    if (!isInferenceRunning) {
      setActiveStage(6);
      return;
    }

    const interval = setInterval(() => {
      setActiveStage((prev) => {
        if (prev < 6) return prev + 1;
        return 6;
      });
    }, 350);

    return () => clearInterval(interval);
  }, [isInferenceRunning]);

  if (!isPipelineModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(4, 9, 20, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '920px',
          borderRadius: '12px',
          border: '1px solid var(--border-active)',
          background: 'var(--bg-card)',
          boxShadow: '0 0 35px rgba(0, 242, 254, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#040914'
            }}>
              <Cpu size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                OceanEmbed Neural Inference Pipeline
              </h2>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                Multimodal Spatiotemporal Encoder-Decoder Architecture
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '0.74rem',
              padding: '3px 8px',
              borderRadius: '4px',
              background: isInferenceRunning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: isInferenceRunning ? 'var(--accent-amber)' : 'var(--accent-emerald)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isInferenceRunning ? 'var(--accent-amber)' : 'var(--accent-emerald)'
              }} />
              {isInferenceRunning ? 'Inference Running (42ms)...' : 'Latent Encoded (256-D)'}
            </span>

            <button
              onClick={() => setIsPipelineModalOpen(false)}
              className="btn-secondary"
              style={{ padding: '6px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body: Pipeline Stages & Interactive Inspection */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Animated 6-Stage Pipeline Flow */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            position: 'relative'
          }}>
            {PIPELINE_STAGES.map((stage) => {
              const isPastOrCurrent = stage.id <= activeStage;
              const isHighlighted = stage.id === selectedStageDetail.id;

              return (
                <div
                  key={stage.id}
                  onClick={() => setSelectedStageDetail(stage)}
                  className="card-interactive"
                  style={{
                    padding: '12px 10px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isHighlighted ? 'var(--accent-cyan)' : isPastOrCurrent ? 'var(--border-active)' : 'var(--border-subtle)'}`,
                    background: isHighlighted
                      ? 'rgba(0, 242, 254, 0.1)'
                      : isPastOrCurrent
                      ? 'var(--bg-surface)'
                      : 'var(--bg-input)',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    boxShadow: isHighlighted ? '0 0 16px rgba(0, 242, 254, 0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: isPastOrCurrent ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                      color: isPastOrCurrent ? '#040914' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {stage.id}
                    </span>
                    <span className="mono" style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      {stage.tensorShape}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {stage.title}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    {stage.subtitle}
                  </div>

                  {/* Step active indicator bar */}
                  <div style={{
                    height: '3px',
                    width: '100%',
                    background: isPastOrCurrent ? 'var(--accent-cyan)' : 'transparent',
                    borderRadius: '2px',
                    marginTop: '8px'
                  }} />
                </div>
              );
            })}
          </div>

          {/* Selected Stage Deep-Dive Card */}
          <div className="card-elevated" style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-active)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(0, 242, 254, 0.15)',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700
                  }}>
                    STAGE {selectedStageDetail.id}: {selectedStageDetail.title.toUpperCase()}
                  </span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tensor: {selectedStageDetail.tensorShape}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', margin: '6px 0' }}>
                  {selectedStageDetail.description}
                </p>
              </div>

              {/* Mathematical Formulation Pill */}
              <div style={{
                background: 'var(--bg-input)',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                textAlign: 'right'
              }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Mathematical Representation
                </span>
                <div className="mono" style={{ fontSize: '0.88rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {selectedStageDetail.math}
                </div>
              </div>
            </div>

            {/* 256-D Latent Vector Snippet (when stage 4 is selected or overall) */}
            {prediction && prediction.embedding256D && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Sample 256-D Latent Vector Elements (z_ocean):
                  </span>
                  <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)' }}>
                    L2-Norm: 1.000 (Normalized Unit Sphere)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {prediction.embedding256D.slice(0, 24).map((val, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '3px 6px',
                        borderRadius: '4px',
                        background: val >= 0 ? 'rgba(0, 242, 254, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        border: `1px solid ${val >= 0 ? 'rgba(0, 242, 254, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        fontSize: '0.68rem',
                        textAlign: 'center',
                        minWidth: '46px'
                      }}
                      className="mono"
                    >
                      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>z_{idx}</div>
                      <div style={{ color: val >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)', fontWeight: 600 }}>
                        {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '3px 8px', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    +232 dims...
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            OceanEmbed Spatiotemporal Multi-Modal Framework &middot; Smart India Hackathon 2026
          </span>
          <button
            onClick={() => setIsPipelineModalOpen(false)}
            className="btn-primary"
            style={{ padding: '6px 16px', fontSize: '0.8rem' }}
          >
            <CheckCircle2 size={14} />
            <span>Apply Reconstructed Profile</span>
          </button>
        </div>

      </div>
    </div>
  );
};
