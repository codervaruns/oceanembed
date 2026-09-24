// 75-Second Automated Guided Pitch & Demo Tour HUD
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React, { useEffect, useState } from 'react';
import { useOcean } from '../../context/OceanContext';
import { STANDARD_DEPTH_LEVELS } from '../../types/ocean';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Sparkles,
  Compass,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Volume2
} from 'lucide-react';

interface TourScene {
  step: number;
  timeSec: number;
  title: string;
  badge: string;
  narrative: string;
  action: () => void;
}

export const GuidedTourOverlay: React.FC = () => {
  const {
    isTourActive,
    tourStep,
    nextTourStep,
    prevTourStep,
    exitTour,
    setActiveTab,
    setSelectedLocation,
    setActiveDepth,
    triggerInference,
    setMapLayer
  } = useOcean();

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [secondsInStep, setSecondsInStep] = useState<number>(0);

  const scenes: TourScene[] = [
    {
      step: 0,
      timeSec: 8,
      badge: 'Scene 1 &middot; The Problem',
      title: 'The Subsurface Ocean Blindspot',
      narrative: 'Satellites provide continuous high-resolution views of the ocean surface, but cannot penetrate below the top millimeters. The subsurface thermal structure remains an observational blindspot critical for cyclones and climate.',
      action: () => {
        setActiveTab('map');
        setActiveDepth(0);
        setMapLayer('temperature');
        setSelectedLocation(14.5, 68.0);
      }
    },
    {
      step: 1,
      timeSec: 9,
      badge: 'Scene 2 &middot; Ingestion',
      title: '7 Multimodal Satellite Surface Signals',
      narrative: 'OceanEmbed ingests seven remote sensing observables—temperature (SST), salinity (SSS), sea level anomaly (SLA), currents, and winds over a 9×9 spatial patch and 31-day temporal window.',
      action: () => {
        setActiveTab('map');
        setSelectedLocation(14.5, 68.0);
      }
    },
    {
      step: 2,
      timeSec: 9,
      badge: 'Scene 3 &middot; Neural Core',
      title: '256-D Ocean Latent Embedding Vector',
      narrative: 'Our multimodal spatio-temporal encoder projects dynamic surface boundary conditions into a compact 256-dimensional latent representation of the 3D water mass.',
      action: () => {
        triggerInference();
      }
    },
    {
      step: 3,
      timeSec: 8,
      badge: 'Scene 4 &middot; Latent Space',
      title: 'Latent Space Physical Clustering',
      narrative: 'In the 256-D embedding space, the model naturally separates distinct North Indian Ocean water masses—such as high-salinity Arabian Sea water and the Bay of Bengal freshwater plume.',
      action: () => {
        setActiveTab('insights');
      }
    },
    {
      step: 4,
      timeSec: 9,
      badge: 'Scene 5 &middot; Subsurface Slicing',
      title: 'Diving from Surface to 1000m Abyss',
      narrative: 'A depth-aware cross-attention decoder queries the 256-D embedding across 15 standard depth levels, reconstructing the full 3D thermal field.',
      action: () => {
        setActiveTab('map');
        setActiveDepth(150);
      }
    },
    {
      step: 5,
      timeSec: 8,
      badge: 'Scene 6 &middot; Uncertainty',
      title: 'Physics-Informed Bayesian Uncertainty',
      narrative: 'Every depth level outputs a ±1.96σ confidence band. Uncertainty is low near the surface (±0.18°C) and widens in the deep ocean where surface constraints weaken.',
      action: () => {
        setActiveTab('map');
        setMapLayer('uncertainty');
      }
    },
    {
      step: 6,
      timeSec: 9,
      badge: 'Scene 7 &middot; Validation',
      title: 'Independent In-Situ ARGO Float Matching',
      narrative: 'Reconstructed profiles match independent WMO ARGO floats across the North Indian Ocean with an overall RMSE under 0.68°C and an R² correlation of 0.964.',
      action: () => {
        setActiveTab('argo');
      }
    },
    {
      step: 7,
      timeSec: 9,
      badge: 'Scene 8 &middot; Disaster Impact',
      title: 'Tropical Cyclone Heat Potential (TCHP)',
      narrative: 'For disaster management, OceanEmbed calculates real-time Tropical Cyclone Heat Potential (TCHP) and D26 isotherm depth to alert forecasters of rapid cyclone intensification risk.',
      action: () => {
        setActiveTab('disaster');
      }
    },
    {
      step: 8,
      timeSec: 7,
      badge: 'Scene 9 &middot; Conclusion',
      title: 'OceanEmbed: Seeing Beneath the Surface',
      narrative: 'A self-supervised deep learning framework turning satellite surface observations into continuous 3D subsurface ocean intelligence for disaster management.',
      action: () => {
        setActiveTab('map');
        setActiveDepth(0);
        setMapLayer('temperature');
      }
    }
  ];

  const currentScene = scenes[tourStep] || scenes[0];

  // Execute step action on step change
  useEffect(() => {
    if (isTourActive && currentScene) {
      currentScene.action();
      setSecondsInStep(0);
    }
  }, [tourStep, isTourActive]);

  // Step Timer
  useEffect(() => {
    if (!isTourActive || !isPlaying) return;

    const interval = setInterval(() => {
      setSecondsInStep((prev) => {
        if (prev >= currentScene.timeSec) {
          nextTourStep();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTourActive, isPlaying, currentScene, nextTourStep]);

  if (!isTourActive) return null;

  return (
    <div
      className="glass-panel"
      style={{
        position: 'fixed',
        bottom: '36px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        width: '92%',
        maxWidth: '840px',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: '1.5px solid var(--accent-cyan)',
        boxShadow: '0 0 35px rgba(0, 242, 254, 0.3)',
        padding: '14px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {/* Top Header with Badge & Step Counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(0, 242, 254, 0.15)',
            color: 'var(--accent-cyan)',
            textTransform: 'uppercase'
          }}>
            {currentScene.badge}
          </span>
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Step {tourStep + 1} of {scenes.length}
          </span>
        </div>

        {/* Playback Controls & Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={prevTourStep}
            disabled={tourStep === 0}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
            title="Previous scene"
          >
            <SkipBack size={12} />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
            title={isPlaying ? 'Pause tour' : 'Resume tour'}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>

          <button
            onClick={nextTourStep}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
            title="Next scene"
          >
            <SkipForward size={12} />
          </button>

          <button
            onClick={exitTour}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--accent-rose)' }}
            title="Exit guided tour"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Main Pitch Narrative & Title */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
          {currentScene.title}
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
          {currentScene.narrative}
        </p>
      </div>

      {/* Timeline Progression Bar */}
      <div style={{ display: 'flex', gap: '4px', height: '4px', marginTop: '2px' }}>
        {scenes.map((s, idx) => {
          const isCompleted = idx < tourStep;
          const isCurrent = idx === tourStep;
          const currentPct = isCurrent ? (secondsInStep / currentScene.timeSec) * 100 : 0;

          return (
            <div
              key={idx}
              onClick={() => {
                // Allow jumping to step
              }}
              style={{
                flex: 1,
                background: 'var(--bg-input)',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: isCompleted ? '100%' : isCurrent ? `${currentPct}%` : '0%',
                  height: '100%',
                  background: 'var(--accent-cyan)',
                  borderRadius: '2px',
                  transition: isCurrent ? 'width 1s linear' : 'none'
                }}
              />
            </div>
          );
        })}
      </div>

    </div>
  );
};
