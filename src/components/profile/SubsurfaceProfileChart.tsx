// Subsurface Temperature-Depth Profile (0-1000m) & Uncertainty Engine
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React, { useState } from 'react';
import { useOcean } from '../../context/OceanContext';
import { STANDARD_DEPTH_LEVELS, DepthLevel } from '../../types/ocean';
import { getThermalColor } from '../../utils/oceanPhysics';
import {
  Thermometer,
  ShieldCheck,
  TrendingDown,
  Layers,
  Activity,
  Maximize2,
  ListFilter,
  CheckCircle2
} from 'lucide-react';

export const SubsurfaceProfileChart: React.FC = () => {
  const {
    prediction,
    activeDepth,
    setActiveDepth,
    selectedLocation,
    theme
  } = useOcean();

  const [showTable, setShowTable] = useState<boolean>(false);
  const [hoveredDepth, setHoveredDepth] = useState<number | null>(null);

  if (!prediction || !prediction.temperatures) {
    return (
      <div className="card-elevated" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading subsurface thermal profile...
      </div>
    );
  }

  // SVG Chart Dimensions
  const chartWidth = 360;
  const chartHeight = 360;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Scales
  const minTemp = 4.0;
  const maxTemp = 32.0;
  const maxDepth = 1000;

  const tempToX = (t: number) => {
    const clamped = Math.max(minTemp, Math.min(maxTemp, t));
    return padding.left + ((clamped - minTemp) / (maxTemp - minTemp)) * plotWidth;
  };

  const depthToY = (d: number) => {
    // Non-linear / pseudo-logarithmic vertical stretch to expand the top 0-200m thermocline region
    // y = sqrt(d / 1000) * plotHeight
    const normalized = Math.sqrt(d / maxDepth);
    return padding.top + normalized * plotHeight;
  };

  // Generate SVG Path for Reconstructed Profile Curve
  const points = prediction.depths.map((d, i) => ({
    x: tempToX(prediction.temperatures[i]),
    y: depthToY(d),
    depth: d,
    temp: prediction.temperatures[i],
    sigma: prediction.uncertainties[i]
  }));

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Generate Polygon Path for Shaded ±1.96σ Bayesian Uncertainty Envelope
  const upperPoints = points.map(pt => ({
    x: tempToX(pt.temp + pt.sigma * 1.5),
    y: pt.y
  }));

  const lowerPoints = points.slice().reverse().map(pt => ({
    x: tempToX(pt.temp - pt.sigma * 1.5),
    y: pt.y
  }));

  const uncertaintyPolygon = `
    ${upperPoints.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ')}
    ${lowerPoints.map(pt => `L ${pt.x} ${pt.y}`).join(' ')}
    Z
  `;

  // ARGO Float Path if co-located
  let argoPathD = '';
  if (prediction.argoProfile && prediction.argoProfile.temperatures) {
    const argoPoints = prediction.argoProfile.depths.map((d, i) => ({
      x: tempToX(prediction.argoProfile!.temperatures[i]),
      y: depthToY(d)
    }));
    argoPathD = argoPoints.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }

  const activeY = depthToY(activeDepth);
  const activeTemp = prediction.temperatures[STANDARD_DEPTH_LEVELS.indexOf(activeDepth)];
  const activeSigma = prediction.uncertainties[STANDARD_DEPTH_LEVELS.indexOf(activeDepth)];

  return (
    <div className="card-elevated" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Header & Oceanographic Diagnostic Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={15} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>
              0–1000m Subsurface Thermal Profile
            </h3>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Reconstructed 15 depth levels with ±1.96σ Bayesian uncertainty bounds
          </p>
        </div>

        {/* View Toggle */}
        <button
          onClick={() => setShowTable(!showTable)}
          className="btn-secondary"
          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
        >
          <ListFilter size={12} />
          <span>{showTable ? 'View Chart' : 'View Data Table'}</span>
        </button>
      </div>

      {/* Oceanographic Derived Metrics Chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{
          fontSize: '0.7rem',
          padding: '3px 8px',
          borderRadius: '4px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--accent-emerald)',
          display: 'flex',
          gap: '4px'
        }}>
          <span>MLD:</span>
          <strong className="mono">{prediction.mld}m</strong>
        </div>

        <div style={{
          fontSize: '0.7rem',
          padding: '3px 8px',
          borderRadius: '4px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: 'var(--accent-amber)',
          display: 'flex',
          gap: '4px'
        }}>
          <span>Thermocline (D20):</span>
          <strong className="mono">{prediction.d20}m</strong>
        </div>

        <div style={{
          fontSize: '0.7rem',
          padding: '3px 8px',
          borderRadius: '4px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--accent-rose)',
          display: 'flex',
          gap: '4px'
        }}>
          <span>Cyclone D26:</span>
          <strong className="mono">{prediction.d26}m</strong>
        </div>

        <div style={{
          fontSize: '0.7rem',
          padding: '3px 8px',
          borderRadius: '4px',
          background: 'rgba(0, 242, 254, 0.12)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          color: 'var(--accent-cyan)',
          display: 'flex',
          gap: '4px'
        }}>
          <span>TCHP:</span>
          <strong className="mono">{prediction.tchp} kJ/cm²</strong>
        </div>
      </div>

      {/* Main Chart or Data Table */}
      {!showTable ? (
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: '100%', maxHeight: '340px', overflow: 'visible' }}
          >
            {/* Background Grid Lines (Depths) */}
            {[0, 50, 100, 200, 500, 1000].map((d) => {
              const y = depthToY(d);
              return (
                <g key={d}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="var(--chart-grid)"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fill="var(--text-muted)"
                  >
                    {d}m
                  </text>
                </g>
              );
            })}

            {/* Temperature Axis Ticks (Top & Bottom) */}
            {[5, 10, 15, 20, 25, 30].map((t) => {
              const x = tempToX(t);
              return (
                <g key={t}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={chartHeight - padding.bottom}
                    stroke="var(--chart-grid)"
                    strokeDasharray="2,2"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={chartHeight - padding.bottom + 14}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fill="var(--text-muted)"
                  >
                    {t}°
                  </text>
                </g>
              );
            })}

            {/* Mixed Layer Depth (MLD) Line */}
            {prediction.mld && (
              <g>
                <line
                  x1={padding.left}
                  y1={depthToY(prediction.mld)}
                  x2={chartWidth - padding.right}
                  y2={depthToY(prediction.mld)}
                  stroke="var(--accent-emerald)"
                  strokeDasharray="4,2"
                  strokeWidth="1.2"
                />
                <text
                  x={chartWidth - padding.right - 4}
                  y={depthToY(prediction.mld) - 3}
                  textAnchor="end"
                  fontSize="8"
                  fill="var(--accent-emerald)"
                  fontFamily="Inter"
                  fontWeight="600"
                >
                  MLD ({prediction.mld}m)
                </text>
              </g>
            )}

            {/* Thermocline (D20) Line */}
            {prediction.d20 && (
              <g>
                <line
                  x1={padding.left}
                  y1={depthToY(prediction.d20)}
                  x2={chartWidth - padding.right}
                  y2={depthToY(prediction.d20)}
                  stroke="var(--accent-amber)"
                  strokeDasharray="4,2"
                  strokeWidth="1.2"
                />
                <text
                  x={chartWidth - padding.right - 4}
                  y={depthToY(prediction.d20) - 3}
                  textAnchor="end"
                  fontSize="8"
                  fill="var(--accent-amber)"
                  fontFamily="Inter"
                  fontWeight="600"
                >
                  Thermocline D20 ({prediction.d20}m)
                </text>
              </g>
            )}

            {/* Shaded Bayesian Uncertainty Band */}
            <path
              d={uncertaintyPolygon}
              fill="rgba(168, 85, 247, 0.18)"
              stroke="none"
            />

            {/* ARGO Float Profile (if co-located) */}
            {argoPathD && (
              <g>
                <path
                  d={argoPathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />
              </g>
            )}

            {/* Main OceanEmbed Predicted Temperature Curve */}
            <path
              d={pathD}
              fill="none"
              stroke="#00f2fe"
              strokeWidth="2.5"
            />

            {/* Discrete 15 Depth Level Points */}
            {points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={activeDepth === pt.depth ? 5.5 : 3.5}
                fill={getThermalColor(pt.temp)}
                stroke="#ffffff"
                strokeWidth={activeDepth === pt.depth ? 2 : 1}
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveDepth(pt.depth as DepthLevel)}
                onMouseEnter={() => setHoveredDepth(pt.depth)}
                onMouseLeave={() => setHoveredDepth(null)}
              />
            ))}

            {/* Active Depth Probe Crosshair Line */}
            <line
              x1={padding.left}
              y1={activeY}
              x2={chartWidth - padding.right}
              y2={activeY}
              stroke="#00f2fe"
              strokeWidth="1.5"
              strokeDasharray="2,2"
            />
            <circle
              cx={tempToX(activeTemp)}
              cy={activeY}
              r="6"
              fill="#00f2fe"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>

          {/* Chart Legend */}
          <div style={{
            position: 'absolute',
            bottom: '4px',
            right: '8px',
            fontSize: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface)',
            padding: '3px 6px',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#00f2fe' }}>
              <span style={{ width: '8px', height: '2px', background: '#00f2fe' }} /> Reconstructed
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#a855f7' }}>
              <span style={{ width: '8px', height: '6px', background: 'rgba(168,85,247,0.4)' }} /> ±σ Bound
            </span>
            {prediction.argoProfile && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#10b981' }}>
                <span style={{ width: '8px', height: '2px', borderTop: '2px dashed #10b981' }} /> ARGO Float
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Data Table View (15 Standard Levels) */
        <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
          <table style={{ width: '100%', fontSize: '0.74rem', borderCollapse: 'collapse', textAlign: 'left' }} className="mono">
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '6px 8px' }}>Depth</th>
                <th style={{ padding: '6px 8px' }}>Temp (°C)</th>
                <th style={{ padding: '6px 8px' }}>Uncertainty</th>
                <th style={{ padding: '6px 8px' }}>ARGO (°C)</th>
                <th style={{ padding: '6px 8px' }}>Delta</th>
              </tr>
            </thead>
            <tbody>
              {STANDARD_DEPTH_LEVELS.map((d, idx) => {
                const t = prediction.temperatures[idx];
                const unc = prediction.uncertainties[idx];
                const argoT = prediction.argoProfile?.temperatures[idx];
                const delta = argoT !== undefined ? Math.round((t - argoT) * 100) / 100 : null;
                const isSelected = activeDepth === d;

                return (
                  <tr
                    key={d}
                    onClick={() => setActiveDepth(d)}
                    style={{
                      background: isSelected ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ padding: '5px 8px', fontWeight: isSelected ? 700 : 400, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                      {d} m
                    </td>
                    <td style={{ padding: '5px 8px', color: getThermalColor(t), fontWeight: 600 }}>
                      {t.toFixed(1)}°
                    </td>
                    <td style={{ padding: '5px 8px', color: 'var(--accent-purple)' }}>
                      ±{unc.toFixed(2)}°
                    </td>
                    <td style={{ padding: '5px 8px', color: 'var(--accent-emerald)' }}>
                      {argoT !== undefined ? `${argoT.toFixed(1)}°` : '--'}
                    </td>
                    <td style={{ padding: '5px 8px', color: delta && Math.abs(delta) < 0.5 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                      {delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)}°` : '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
