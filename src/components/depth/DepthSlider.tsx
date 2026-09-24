// Vertical & Horizontal Ocean Depth Controller ("Diving" Engine)
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { useOcean } from '../../context/OceanContext';
import { STANDARD_DEPTH_LEVELS, DepthLevel } from '../../types/ocean';
import { Layers, ArrowDown, ArrowUp, Sparkles, Anchor } from 'lucide-react';

export const DepthSlider: React.FC = () => {
  const { activeDepth, setActiveDepth, prediction } = useOcean();

  const currentIndex = STANDARD_DEPTH_LEVELS.indexOf(activeDepth);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10);
    setActiveDepth(STANDARD_DEPTH_LEVELS[idx]);
  };

  const handleStepDown = () => {
    if (currentIndex < STANDARD_DEPTH_LEVELS.length - 1) {
      setActiveDepth(STANDARD_DEPTH_LEVELS[currentIndex + 1]);
    }
  };

  const handleStepUp = () => {
    if (currentIndex > 0) {
      setActiveDepth(STANDARD_DEPTH_LEVELS[currentIndex - 1]);
    }
  };

  const currentTemp = prediction && prediction.temperatures
    ? prediction.temperatures[currentIndex]
    : null;

  const currentUnc = prediction && prediction.uncertainties
    ? prediction.uncertainties[currentIndex]
    : null;

  return (
    <div className="card-elevated" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* Header with Depth Metric and Dive Animation status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(0, 242, 254, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)'
          }}>
            <Anchor size={16} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Subsurface Depth Slicer
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <strong className="mono" style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)' }}>
                {activeDepth} <span style={{ fontSize: '0.85rem' }}>meters</span>
              </strong>
              <span style={{
                fontSize: '0.68rem',
                color: activeDepth <= 200 ? 'var(--accent-emerald)' : 'var(--accent-purple)',
                background: 'var(--bg-surface)',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)'
              }}>
                {activeDepth <= 50 ? 'Epipelagic (Mixed Layer)' : activeDepth <= 200 ? 'Thermocline Gradient' : 'Mesopelagic (Intermediate)'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Thermal Readout at this Depth */}
        {currentTemp !== null && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-surface)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Layer Temp:</span>
              <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentTemp}°C
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Uncertainty:</span>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-purple)' }}>
                ±{currentUnc}°C
              </div>
            </div>
          </div>
        )}

        {/* Step Up / Down Buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleStepUp}
            disabled={currentIndex === 0}
            className="btn-secondary"
            style={{ padding: '6px 8px', opacity: currentIndex === 0 ? 0.4 : 1 }}
            title="Ascend to shallower depth"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={handleStepDown}
            disabled={currentIndex === STANDARD_DEPTH_LEVELS.length - 1}
            className="btn-secondary"
            style={{ padding: '6px 8px', opacity: currentIndex === STANDARD_DEPTH_LEVELS.length - 1 ? 0.4 : 1 }}
            title="Dive deeper into ocean column"
          >
            <ArrowDown size={14} />
          </button>
        </div>
      </div>

      {/* Range Slider Track with 15 Discrete Depth Stops */}
      <div style={{ position: 'relative', padding: '6px 0' }}>
        <input
          type="range"
          min={0}
          max={STANDARD_DEPTH_LEVELS.length - 1}
          step={1}
          value={currentIndex}
          onChange={handleSliderChange}
          style={{
            width: '100%',
            accentColor: '#00f2fe',
            cursor: 'pointer',
            height: '6px',
            borderRadius: '3px'
          }}
        />

        {/* Depth Ticks */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.65rem', color: 'var(--text-muted)' }} className="mono">
          <span>0m (Surface)</span>
          <span>50m</span>
          <span>100m</span>
          <span>200m</span>
          <span>500m</span>
          <span>1000m (Abyssal)</span>
        </div>
      </div>

      {/* Oceanographic Preset Quick Jump Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
          Key Strata:
        </span>
        
        <button
          onClick={() => setActiveDepth(0)}
          className={`nav-tab ${activeDepth === 0 ? 'active' : ''}`}
          style={{ padding: '2px 8px', fontSize: '0.72rem' }}
        >
          Surface (0m)
        </button>

        {prediction && (
          <>
            <button
              onClick={() => {
                // Find closest standard depth to MLD
                const closest = STANDARD_DEPTH_LEVELS.reduce((prev, curr) =>
                  Math.abs(curr - prediction.mld) < Math.abs(prev - prediction.mld) ? curr : prev
                );
                setActiveDepth(closest);
              }}
              className="nav-tab"
              style={{ padding: '2px 8px', fontSize: '0.72rem', color: 'var(--accent-emerald)' }}
              title={`Jump to Mixed Layer Depth (${prediction.mld}m)`}
            >
              MLD ({prediction.mld}m)
            </button>

            <button
              onClick={() => {
                const closest = STANDARD_DEPTH_LEVELS.reduce((prev, curr) =>
                  Math.abs(curr - prediction.d20) < Math.abs(prev - prediction.d20) ? curr : prev
                );
                setActiveDepth(closest);
              }}
              className="nav-tab"
              style={{ padding: '2px 8px', fontSize: '0.72rem', color: 'var(--accent-amber)' }}
              title={`Jump to 20°C Thermocline Isotherm (${prediction.d20}m)`}
            >
              Thermocline D20 ({prediction.d20}m)
            </button>

            <button
              onClick={() => {
                const closest = STANDARD_DEPTH_LEVELS.reduce((prev, curr) =>
                  Math.abs(curr - prediction.d26) < Math.abs(prev - prediction.d26) ? curr : prev
                );
                setActiveDepth(closest);
              }}
              className="nav-tab"
              style={{ padding: '2px 8px', fontSize: '0.72rem', color: 'var(--accent-rose)' }}
              title={`Jump to 26°C Cyclone Heat Boundary (${prediction.d26}m)`}
            >
              Cyclone D26 ({prediction.d26}m)
            </button>
          </>
        )}

        <button
          onClick={() => setActiveDepth(1000)}
          className={`nav-tab ${activeDepth === 1000 ? 'active' : ''}`}
          style={{ padding: '2px 8px', fontSize: '0.72rem' }}
        >
          Abyss (1000m)
        </button>
      </div>

    </div>
  );
};
