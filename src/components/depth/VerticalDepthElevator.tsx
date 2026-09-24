// Vertical Subsurface Bathythermograph Depth Elevator
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React from 'react';
import { useOcean } from '../../context/OceanContext';
import { STANDARD_DEPTH_LEVELS, DepthLevel } from '../../types/ocean';
import { getThermalColor } from '../../utils/oceanPhysics';
import { Anchor, ArrowDown, ArrowUp, Layers } from 'lucide-react';

export const VerticalDepthElevator: React.FC = () => {
  const { activeDepth, setActiveDepth, prediction } = useOcean();

  const currentIndex = STANDARD_DEPTH_LEVELS.indexOf(activeDepth);

  const getStratumName = (depth: number) => {
    if (depth === 0) return 'Surface Skin';
    if (depth <= 50) return 'Mixed Layer';
    if (depth <= 150) return 'Thermocline Core';
    if (depth <= 300) return 'Lower Thermocline';
    if (depth <= 500) return 'Intermediate Water';
    return 'Deep Abyssal Water';
  };

  return (
    <div
      className="hud-panel"
      style={{
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        maxHeight: '460px',
        userSelect: 'none'
      }}
    >
      {/* Top Header */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Depth Dive
        </span>
        <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
          {activeDepth}m
        </div>
      </div>

      {/* Up Button */}
      <button
        onClick={() => {
          if (currentIndex > 0) setActiveDepth(STANDARD_DEPTH_LEVELS[currentIndex - 1]);
        }}
        disabled={currentIndex === 0}
        className="btn-tactical-secondary"
        style={{ padding: '3px 6px', opacity: currentIndex === 0 ? 0.3 : 1 }}
        title="Ascend to shallower depth"
      >
        <ArrowUp size={11} />
      </button>

      {/* 15 Vertical Depth Notches */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1,
        overflowY: 'auto',
        padding: '2px 0'
      }}>
        {STANDARD_DEPTH_LEVELS.map((d, idx) => {
          const isSelected = activeDepth === d;
          const temp = prediction?.temperatures[idx];
          const color = temp !== undefined ? getThermalColor(temp) : 'var(--accent-cyan)';

          return (
            <div
              key={d}
              onClick={() => setActiveDepth(d)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: isSelected ? 'rgba(0, 242, 254, 0.18)' : 'transparent',
                border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={`${d}m (${getStratumName(d)}): ${temp !== undefined ? `${temp.toFixed(1)}°C` : ''}`}
            >
              {/* Depth Pip */}
              <span
                style={{
                  width: isSelected ? '8px' : '5px',
                  height: isSelected ? '8px' : '5px',
                  borderRadius: '50%',
                  background: color,
                  boxShadow: isSelected ? `0 0 8px ${color}` : 'none'
                }}
              />
              <span
                className="mono"
                style={{
                  fontSize: '0.68rem',
                  fontWeight: isSelected ? 700 : 400,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                  minWidth: '34px'
                }}
              >
                {d}m
              </span>
            </div>
          );
        })}
      </div>

      {/* Down Button */}
      <button
        onClick={() => {
          if (currentIndex < STANDARD_DEPTH_LEVELS.length - 1) setActiveDepth(STANDARD_DEPTH_LEVELS[currentIndex + 1]);
        }}
        disabled={currentIndex === STANDARD_DEPTH_LEVELS.length - 1}
        className="btn-tactical-secondary"
        style={{ padding: '3px 6px', opacity: currentIndex === STANDARD_DEPTH_LEVELS.length - 1 ? 0.3 : 1 }}
        title="Dive deeper"
      >
        <ArrowDown size={11} />
      </button>

      {/* Quick Stratum Indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
        <button
          onClick={() => setActiveDepth(0)}
          className={`btn-tactical-secondary ${activeDepth === 0 ? 'active' : ''}`}
          style={{ padding: '2px 4px', fontSize: '0.62rem', justifyContent: 'center' }}
        >
          Surface
        </button>
        {prediction && (
          <button
            onClick={() => {
              const closest = STANDARD_DEPTH_LEVELS.reduce((prev, curr) =>
                Math.abs(curr - prediction.d20) < Math.abs(prev - prediction.d20) ? curr : prev
              );
              setActiveDepth(closest);
            }}
            className="btn-tactical-secondary"
            style={{ padding: '2px 4px', fontSize: '0.62rem', justifyContent: 'center', color: 'var(--accent-amber)' }}
            title={`Thermocline Core (D20: ${prediction.d20}m)`}
          >
            D20 ({prediction.d20}m)
          </button>
        )}
        <button
          onClick={() => setActiveDepth(1000)}
          className={`btn-tactical-secondary ${activeDepth === 1000 ? 'active' : ''}`}
          style={{ padding: '2px 4px', fontSize: '0.62rem', justifyContent: 'center' }}
        >
          1000m
        </button>
      </div>
    </div>
  );
};
