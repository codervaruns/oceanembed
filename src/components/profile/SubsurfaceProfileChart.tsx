// Scientific Subsurface CTD Profile & Multi-Physical Acoustic/Dynamic Stratification Engine
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React, { useState } from 'react';
import { useOcean } from '../../context/OceanContext';
import { STANDARD_DEPTH_LEVELS, DepthLevel, ProfileCurveMode } from '../../types/ocean';
import { getThermalColor, getSalinityColor } from '../../utils/oceanPhysics';
import {
  TrendingDown,
  ListFilter,
  Download,
  Activity,
  Waves,
  Volume2,
  Layers,
  ShieldCheck
} from 'lucide-react';

export const SubsurfaceProfileChart: React.FC = () => {
  const {
    prediction,
    activeDepth,
    setActiveDepth,
    selectedLocation
  } = useOcean();

  const [showTable, setShowTable] = useState<boolean>(false);
  const [curveMode, setCurveMode] = useState<ProfileCurveMode>('temperature');
  const [showUncertaintyComponents, setShowUncertaintyComponents] = useState<boolean>(false);

  if (!prediction || !prediction.temperatures) {
    return (
      <div className="card-elevated" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading subsurface physical profiles...
      </div>
    );
  }

  // SVG Chart Dimensions
  const chartWidth = 380;
  const chartHeight = 360;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const maxDepth = 1000;

  // Coordinate transforms
  const depthToY = (d: number) => {
    // Semi-logarithmic vertical stretch to resolve the upper 0-200m mixed layer and thermocline
    const normalized = Math.sqrt(d / maxDepth);
    return padding.top + normalized * plotHeight;
  };

  let minVal = 4.0;
  let maxVal = 32.0;
  let activeValueArray: number[] = prediction.temperatures;
  let unitLabel = '°C';

  if (curveMode === 'brunt_vaisala') {
    minVal = 0;
    maxVal = 0.0006;
    activeValueArray = prediction.bruntVaisalaN2;
    unitLabel = 'rad²/s²';
  } else if (curveMode === 'sound_speed') {
    minVal = 1480;
    maxVal = 1545;
    activeValueArray = prediction.soundSpeeds;
    unitLabel = 'm/s';
  } else if (curveMode === 'density') {
    minVal = 20.0;
    maxVal = 27.5;
    activeValueArray = prediction.densityProfile;
    unitLabel = 'kg/m³';
  }

  const valToX = (v: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, v));
    return padding.left + ((clamped - minVal) / (maxVal - minVal)) * plotWidth;
  };

  // Main Curve Points
  const points = prediction.depths.map((d, i) => ({
    x: valToX(activeValueArray[i]),
    y: depthToY(d),
    depth: d,
    val: activeValueArray[i],
    temp: prediction.temperatures[i],
    sigma: prediction.uncertainties[i]
  }));

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Uncertainty Polygon (for Temperature curve mode)
  const upperPoints = points.map(pt => ({
    x: valToX(pt.temp + pt.sigma * 1.5),
    y: pt.y
  }));

  const lowerPoints = points.slice().reverse().map(pt => ({
    x: valToX(pt.temp - pt.sigma * 1.5),
    y: pt.y
  }));

  const uncertaintyPolygon = `
    ${upperPoints.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ')}
    ${lowerPoints.map(pt => `L ${pt.x} ${pt.y}`).join(' ')}
    Z
  `;

  // ARGO Float Path
  let argoPathD = '';
  if (prediction.argoProfile && prediction.argoProfile.temperatures && curveMode === 'temperature') {
    const argoPoints = prediction.argoProfile.depths.map((d, i) => ({
      x: valToX(prediction.argoProfile!.temperatures[i]),
      y: depthToY(d)
    }));
    argoPathD = argoPoints.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }

  const activeY = depthToY(activeDepth);
  const activeTemp = prediction.temperatures[STANDARD_DEPTH_LEVELS.indexOf(activeDepth)];
  const activeSigma = prediction.uncertainties[STANDARD_DEPTH_LEVELS.indexOf(activeDepth)];

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = 'Depth_m,Temperature_C,Uncertainty_C,Epistemic_C,Aleatoric_C,Salinity_PSU,SoundSpeed_mps,SigmaTheta_kgm3,BruntVaisala_rad2s2\n';
    const rows = STANDARD_DEPTH_LEVELS.map((d, i) => {
      return `${d},${prediction.temperatures[i]},${prediction.uncertainties[i]},${prediction.epistemicUncertainty[i]},${prediction.aleatoricUncertainty[i]},${prediction.salinities[i]},${prediction.soundSpeeds[i]},${prediction.densityProfile[i]},${prediction.bruntVaisalaN2[i]}`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OceanEmbed_Profile_${selectedLocation.lat}N_${selectedLocation.lon}E.csv`;
    a.click();
  };

  return (
    <div className="card-elevated" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Header & Curve Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={15} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>
              0–1000m Subsurface CTD & Acoustic Profile
            </h3>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Reconstructed vertical stratification at {selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lon.toFixed(2)}°E
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleExportCSV}
            className="btn-secondary"
            style={{ fontSize: '0.7rem', padding: '3px 8px' }}
            title="Export full 15-level CTD profile to CSV"
          >
            <Download size={11} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowTable(!showTable)}
            className="btn-secondary"
            style={{ fontSize: '0.7rem', padding: '3px 8px' }}
          >
            <ListFilter size={11} />
            <span>{showTable ? 'View Chart' : 'View Table'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Parameter Curve Selector */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setCurveMode('temperature')}
          className={`nav-tab ${curveMode === 'temperature' ? 'active' : ''}`}
          style={{ flex: 1, justifyContent: 'center', padding: '3px 6px', fontSize: '0.68rem' }}
        >
          Temp T(z)
        </button>
        <button
          onClick={() => setCurveMode('sound_speed')}
          className={`nav-tab ${curveMode === 'sound_speed' ? 'active' : ''}`}
          style={{ flex: 1, justifyContent: 'center', padding: '3px 6px', fontSize: '0.68rem' }}
          title="Mackenzie Sound Speed Profile c(z)"
        >
          Sound c(z)
        </button>
        <button
          onClick={() => setCurveMode('brunt_vaisala')}
          className={`nav-tab ${curveMode === 'brunt_vaisala' ? 'active' : ''}`}
          style={{ flex: 1, justifyContent: 'center', padding: '3px 6px', fontSize: '0.68rem' }}
          title="Brunt-Väisälä Buoyancy Frequency N²(z)"
        >
          Buoyancy N²(z)
        </button>
        <button
          onClick={() => setCurveMode('density')}
          className={`nav-tab ${curveMode === 'density' ? 'active' : ''}`}
          style={{ flex: 1, justifyContent: 'center', padding: '3px 6px', fontSize: '0.68rem' }}
          title="Potential Density Sigma-Theta"
        >
          Density σ_θ
        </button>
      </div>

      {/* Oceanographic Derived Metrics Chips */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <div style={{
          fontSize: '0.68rem',
          padding: '2px 7px',
          borderRadius: '4px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--accent-emerald)',
          display: 'flex',
          gap: '4px'
        }} title="Mixed Layer Depth (delta-T = 0.2°C)">
          <span>MLD:</span>
          <strong className="mono">{prediction.mld}m</strong>
        </div>

        <div style={{
          fontSize: '0.68rem',
          padding: '2px 7px',
          borderRadius: '4px',
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: 'var(--accent-cyan)',
          display: 'flex',
          gap: '4px'
        }} title="Barrier Layer Thickness (ILD - MLD)">
          <span>Barrier BLT:</span>
          <strong className="mono">{prediction.blt}m</strong>
        </div>

        <div style={{
          fontSize: '0.68rem',
          padding: '2px 7px',
          borderRadius: '4px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: 'var(--accent-amber)',
          display: 'flex',
          gap: '4px'
        }} title="20°C Isotherm Thermocline Proxy">
          <span>D20:</span>
          <strong className="mono">{prediction.d20}m</strong>
        </div>

        <div style={{
          fontSize: '0.68rem',
          padding: '2px 7px',
          borderRadius: '4px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--accent-rose)',
          display: 'flex',
          gap: '4px'
        }} title="Tropical Cyclone Heat Potential">
          <span>TCHP:</span>
          <strong className="mono">{prediction.tchp} kJ/cm²</strong>
        </div>

        <div style={{
          fontSize: '0.68rem',
          padding: '2px 7px',
          borderRadius: '4px',
          background: 'rgba(168, 85, 247, 0.12)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          color: 'var(--accent-purple)',
          display: 'flex',
          gap: '4px'
        }} title="Upper Ocean Heat Content (0-300m)">
          <span>OHC₃₀₀:</span>
          <strong className="mono">{prediction.uohc300} GJ/m²</strong>
        </div>
      </div>

      {/* Main Chart or Data Table */}
      {!showTable ? (
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: '100%', maxHeight: '340px', overflow: 'visible' }}
          >
            {/* Depth Grid Lines */}
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
                    fontSize="8.5"
                    fontFamily="JetBrains Mono"
                    fill="var(--text-muted)"
                  >
                    {d}m
                  </text>
                </g>
              );
            })}

            {/* Value Ticks (Bottom Axis) */}
            {curveMode === 'temperature' && [5, 10, 15, 20, 25, 30].map((t) => {
              const x = valToX(t);
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
                    fontSize="8.5"
                    fontFamily="JetBrains Mono"
                    fill="var(--text-muted)"
                  >
                    {t}°C
                  </text>
                </g>
              );
            })}

            {curveMode === 'sound_speed' && [1490, 1510, 1530].map((c) => {
              const x = valToX(c);
              return (
                <g key={c}>
                  <text
                    x={x}
                    y={chartHeight - padding.bottom + 14}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono"
                    fill="var(--text-muted)"
                  >
                    {c} m/s
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
                  fontSize="7.5"
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
                  fontSize="7.5"
                  fill="var(--accent-amber)"
                  fontFamily="Inter"
                  fontWeight="600"
                >
                  D20 ({prediction.d20}m)
                </text>
              </g>
            )}

            {/* Shaded Uncertainty Band (for Temperature mode) */}
            {curveMode === 'temperature' && (
              <path
                d={uncertaintyPolygon}
                fill="rgba(168, 85, 247, 0.18)"
                stroke="none"
              />
            )}

            {/* ARGO Float Profile (if co-located & in temperature mode) */}
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

            {/* Main Reconstructed Curve */}
            <path
              d={pathD}
              fill="none"
              stroke={curveMode === 'sound_speed' ? '#38bdf8' : curveMode === 'brunt_vaisala' ? '#a855f7' : '#00f2fe'}
              strokeWidth="2.5"
            />

            {/* Depth Level Points */}
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
              />
            ))}

            {/* Active Depth Probe Line */}
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
              cx={valToX(activeValueArray[STANDARD_DEPTH_LEVELS.indexOf(activeDepth)])}
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
            fontSize: '0.62rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#00f2fe' }}>
              <span style={{ width: '8px', height: '2px', background: '#00f2fe' }} /> Reconstructed
            </span>
            {curveMode === 'temperature' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#a855f7' }}>
                <span style={{ width: '8px', height: '6px', background: 'rgba(168,85,247,0.4)' }} /> ±1.96σ
              </span>
            )}
            {prediction.argoProfile && curveMode === 'temperature' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#10b981' }}>
                <span style={{ width: '8px', height: '2px', borderTop: '2px dashed #10b981' }} /> In-Situ ARGO
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Data Table View (15 Standard Levels) */
        <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
          <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse', textAlign: 'left' }} className="mono">
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '5px 6px' }}>Depth</th>
                <th style={{ padding: '5px 6px' }}>Temp (°C)</th>
                <th style={{ padding: '5px 6px' }}>Uncertainty</th>
                <th style={{ padding: '5px 6px' }}>Salinity</th>
                <th style={{ padding: '5px 6px' }}>Sound Speed</th>
              </tr>
            </thead>
            <tbody>
              {STANDARD_DEPTH_LEVELS.map((d, idx) => {
                const t = prediction.temperatures[idx];
                const unc = prediction.uncertainties[idx];
                const s = prediction.salinities[idx];
                const c = prediction.soundSpeeds[idx];
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
                    <td style={{ padding: '4px 6px', fontWeight: isSelected ? 700 : 400, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                      {d} m
                    </td>
                    <td style={{ padding: '4px 6px', color: getThermalColor(t), fontWeight: 600 }}>
                      {t.toFixed(1)}°
                    </td>
                    <td style={{ padding: '4px 6px', color: 'var(--accent-purple)' }}>
                      ±{unc.toFixed(2)}°
                    </td>
                    <td style={{ padding: '4px 6px', color: 'var(--accent-blue)' }}>
                      {s.toFixed(2)} PSU
                    </td>
                    <td style={{ padding: '4px 6px', color: 'var(--text-muted)' }}>
                      {c.toFixed(0)} m/s
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
