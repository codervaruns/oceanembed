// High-Performance Scientific Geospatial Ocean Engine
// North Indian Ocean (4°N–26°N, 54°E–96°E) with Vectorized Coastlines & Contours
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useOcean } from '../../context/OceanContext';
import { ArgoFloatObservation } from '../../types/ocean';
import { getThermalColor, getUncertaintyColor, getSalinityColor } from '../../utils/oceanPhysics';
import { NIO_COASTLINES, NIO_BATHYMETRIC_FEATURES } from '../../utils/coastlineData';
import { oceanDataManager } from '../../services/data/oceanDataProvider';
import {
  Layers,
  Crosshair,
  Thermometer,
  ShieldAlert,
  Wind,
  Compass,
  MapPin,
  Waves,
  Eye,
  Info
} from 'lucide-react';

export const NorthIndianOceanMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    selectedLocation,
    setSelectedLocation,
    activeDepth,
    mapLayer,
    setMapLayer,
    theme
  } = useOcean();

  const [hoverCoord, setHoverCoord] = useState<{ lat: number; lon: number; temp?: number } | null>(null);
  const [argoFloats, setArgoFloats] = useState<ArgoFloatObservation[]>([]);
  const [showBathymetryFeatures, setShowBathymetryFeatures] = useState<boolean>(true);

  // NIO Geospatial Bounding Box
  const MIN_LAT = 4.0;
  const MAX_LAT = 26.0;
  const MIN_LON = 54.0;
  const MAX_LON = 96.0;

  useEffect(() => {
    const fetchFloats = async () => {
      const floats = await oceanDataManager.getProvider().getArgoBenchmarkProfiles();
      setArgoFloats(floats);
    };
    fetchFloats();
  }, []);

  const latLonToCanvas = useCallback((lat: number, lon: number, width: number, height: number) => {
    const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * width;
    const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * height;
    return { x, y };
  }, []);

  const canvasToLatLon = useCallback((x: number, y: number, width: number, height: number) => {
    const lon = MIN_LON + (x / width) * (MAX_LON - MIN_LON);
    const lat = MAX_LAT - (y / height) * (MAX_LAT - MIN_LAT);
    return {
      lat: Math.round(lat * 100) / 100,
      lon: Math.round(lon * 100) / 100
    };
  }, []);

  // Ray-casting algorithm to test if a point is inside any vectorized land polygon
  const isInsidePolygon = (lon: number, lat: number, polygon: [number, number][]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];
      const intersect = ((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const isLandCoordinate = useCallback((lat: number, lon: number) => {
    for (const poly of NIO_COASTLINES) {
      if (isInsidePolygon(lon, lat, poly.points)) {
        return true;
      }
    }
    return false;
  }, []);

  // High-fidelity continuous 2D thermal & dynamic field synthesizer
  const getFieldTemperature = useCallback((lat: number, lon: number, depth: number) => {
    const isBayOfBengal = lon > 80.0 && lat > 8.0;
    const isArabianSea = lon < 77.0 && lat > 8.0;
    const isSomali = lon < 60.0 && lat < 16.0;

    let sst = 29.2;
    let thermoclineCenter = 120;
    let sharpness = 0.022;
    let deepT = 5.8;

    if (isBayOfBengal) {
      sst = 30.2 - ((lat - 8) / 14) * 0.7;
      thermoclineCenter = 75;
      sharpness = 0.035;
      deepT = 6.2;
    } else if (isSomali) {
      sst = 26.2 + Math.sin(lat * 0.5) * 1.4;
      thermoclineCenter = 42;
      sharpness = 0.042;
      deepT = 5.4;
    } else if (isArabianSea) {
      sst = 28.9 - ((lat - 8) / 16) * 1.1;
      thermoclineCenter = 135;
      sharpness = 0.020;
      deepT = 5.9;
    } else {
      sst = 29.9 + Math.sin(lon * 0.2) * 0.35;
      thermoclineCenter = 110;
      sharpness = 0.025;
      deepT = 5.8;
    }

    // Mesoscale eddy perturbations (Lakshadweep High/Low & Sri Lanka Dome)
    const eddySLD = Math.sin((lat - 8.5) * 0.8) * Math.cos((lon - 83.5) * 0.8) * 1.8;
    const eddyLakshadweep = Math.sin((lat - 11.0) * 0.6) * Math.cos((lon - 72.0) * 0.6) * 1.4;
    const effThermocline = thermoclineCenter + (eddySLD + eddyLakshadweep) * 12;

    const logistic = 1 / (1 + Math.exp(sharpness * (depth - effThermocline)));
    return deepT + (sst - deepT) * logistic;
  }, []);

  const getFieldUncertainty = useCallback((lat: number, lon: number, depth: number) => {
    const isBayOfBengal = lon > 80.0 && lat > 8.0;
    const thermoclineCenter = isBayOfBengal ? 75 : 125;
    const thermoclineGradFactor = Math.exp(-Math.pow((depth - thermoclineCenter) / 38, 2)) * 0.42;
    const baseDepthUncertainty = 0.12 + (depth / 1000) * 0.88;
    return baseDepthUncertainty + thermoclineGradFactor;
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Streamline particles for ocean currents / winds
    const particleCount = 75;
    const particles: { x: number; y: number; age: number; maxAge: number; speed: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        age: Math.floor(Math.random() * 80),
        maxAge: 60 + Math.floor(Math.random() * 60),
        speed: 0.8 + Math.random() * 0.8
      });
    }

    const render = () => {
      time += 0.02;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background
      ctx.fillStyle = theme === 'dark' ? '#040914' : '#e2e8f0';
      ctx.fillRect(0, 0, width, height);

      // 2. Render Ocean Thermal / Uncertainty Raster Grid (High-resolution 8px cells)
      const cellSize = 8;
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellSize;
          const y = r * cellSize;
          const { lat, lon } = canvasToLatLon(x + cellSize / 2, y + cellSize / 2, width, height);

          if (!isLandCoordinate(lat, lon)) {
            if (mapLayer === 'uncertainty') {
              const unc = getFieldUncertainty(lat, lon, activeDepth);
              ctx.fillStyle = getUncertaintyColor(unc);
            } else {
              const temp = getFieldTemperature(lat, lon, activeDepth);
              ctx.fillStyle = getThermalColor(temp);
            }
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }

      // 3. Render High-Resolution Vector Coastlines & Land Polygons
      ctx.save();
      NIO_COASTLINES.forEach((poly) => {
        if (poly.points.length < 3) return;
        ctx.beginPath();
        const start = latLonToCanvas(poly.points[0][1], poly.points[0][0], width, height);
        ctx.moveTo(start.x, start.y);

        for (let i = 1; i < poly.points.length; i++) {
          const pt = latLonToCanvas(poly.points[i][1], poly.points[i][0], width, height);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();

        // Land Fill
        ctx.fillStyle = theme === 'dark' ? '#0b162c' : '#cbd5e1';
        ctx.fill();

        // Coastline Stroke
        ctx.strokeStyle = theme === 'dark' ? '#1e3a66' : '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
      ctx.restore();

      // 4. Draw Graticules & Coordinate Gridlines (5° intervals)
      ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      [5, 10, 15, 20, 25].forEach((lat) => {
        const { y } = latLonToCanvas(lat, MIN_LON, width, height);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.fillStyle = theme === 'dark' ? '#64748b' : '#475569';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`${lat}°00'N`, 6, y - 4);
      });

      [60, 70, 80, 90].forEach((lon) => {
        const { x } = latLonToCanvas(MIN_LAT, lon, width, height);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        ctx.fillStyle = theme === 'dark' ? '#64748b' : '#475569';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`${lon}°00'E`, x + 4, height - 6);
      });
      ctx.setLineDash([]);

      // 5. Draw Bathymetric Feature Annotations (Ridges, Basins, Trenches)
      if (showBathymetryFeatures) {
        NIO_BATHYMETRIC_FEATURES.forEach((feat) => {
          const pos = latLonToCanvas(feat.lat, feat.lon, width, height);
          ctx.font = '500 10px Inter';
          ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.5)';
          ctx.fillText(feat.name.toUpperCase(), pos.x, pos.y);
          ctx.font = '400 8px JetBrains Mono';
          ctx.fillStyle = theme === 'dark' ? 'rgba(0, 242, 254, 0.5)' : 'rgba(2, 132, 199, 0.6)';
          ctx.fillText(feat.depthRange, pos.x, pos.y + 10);
        });
      }

      // 6. Draw Animated Ocean Streamline Tracers (Currents / Winds)
      if (mapLayer === 'currents' || mapLayer === 'winds') {
        ctx.lineWidth = 1.2;

        particles.forEach((p) => {
          p.age += 1;
          if (p.age >= p.maxAge) {
            p.x = Math.random() * width;
            p.y = Math.random() * height;
            p.age = 0;
          }

          const { lat, lon } = canvasToLatLon(p.x, p.y, width, height);
          if (isLandCoordinate(lat, lon)) {
            p.age = p.maxAge;
            return;
          }

          // Flow direction: Somali Jet along west, eastward equatorial flow, cyclonic BoB gyre
          const angle = Math.sin(lat * 0.2 + lon * 0.15 + time * 0.5) * 0.6 + (lon > 80 ? 0.35 : -0.25);
          const dx = Math.cos(angle) * p.speed * 2.5;
          const dy = Math.sin(angle) * p.speed * 2.5;

          const alpha = Math.sin((p.age / p.maxAge) * Math.PI) * 0.75;
          ctx.strokeStyle = mapLayer === 'currents'
            ? `rgba(0, 242, 254, ${alpha})`
            : `rgba(245, 158, 11, ${alpha})`;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          p.x += dx;
          p.y += dy;
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        });
      }

      // 7. Draw In-Situ WMO ARGO Float Markers
      if (mapLayer === 'argo' || mapLayer === 'temperature' || mapLayer === 'uncertainty') {
        argoFloats.forEach((float) => {
          const { x, y } = latLonToCanvas(float.lat, float.lon, width, height);

          // Pulsing halo
          const pulse = 7 + Math.sin(time * 3 + float.cycleNumber) * 4;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.fill();

          // Float Core Diamond
          ctx.beginPath();
          ctx.moveTo(x, y - 5);
          ctx.lineTo(x + 5, y);
          ctx.lineTo(x, y + 5);
          ctx.lineTo(x - 5, y);
          ctx.closePath();
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Label
          ctx.font = '600 8.5px JetBrains Mono';
          ctx.fillStyle = theme === 'dark' ? '#10b981' : '#047857';
          ctx.fillText(`WMO ${float.wmoId}`, x + 8, y + 3);
        });
      }

      // 8. Draw Target Crosshair & Target HUD Tag
      const target = latLonToCanvas(selectedLocation.lat, selectedLocation.lon, width, height);

      // Outer target glow
      ctx.beginPath();
      ctx.arc(target.x, target.y, 13, 0, Math.PI * 2);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Crosshair ticks
      ctx.beginPath();
      ctx.moveTo(target.x - 18, target.y);
      ctx.lineTo(target.x - 5, target.y);
      ctx.moveTo(target.x + 5, target.y);
      ctx.lineTo(target.x + 18, target.y);
      ctx.moveTo(target.x, target.y - 18);
      ctx.lineTo(target.x, target.y - 5);
      ctx.moveTo(target.x, target.y + 5);
      ctx.lineTo(target.x, target.y + 18);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(target.x, target.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Target Tag Pill
      ctx.fillStyle = theme === 'dark' ? 'rgba(8, 19, 38, 0.94)' : 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1;
      const tag = `${selectedLocation.lat.toFixed(2)}°N, ${selectedLocation.lon.toFixed(2)}°E`;
      ctx.font = 'bold 9.5px JetBrains Mono';
      const tw = ctx.measureText(tag).width;
      ctx.fillRect(target.x + 12, target.y - 22, tw + 12, 17);
      ctx.strokeRect(target.x + 12, target.y - 22, tw + 12, 17);
      ctx.fillStyle = theme === 'dark' ? '#00f2fe' : '#0284c7';
      ctx.fillText(tag, target.x + 18, target.y - 10);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    activeDepth,
    mapLayer,
    theme,
    selectedLocation,
    argoFloats,
    showBathymetryFeatures,
    canvasToLatLon,
    latLonToCanvas,
    isLandCoordinate,
    getFieldTemperature,
    getFieldUncertainty
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const { lat, lon } = canvasToLatLon(x, y, canvas.width, canvas.height);
    if (!isLandCoordinate(lat, lon)) {
      setSelectedLocation(lat, lon);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const { lat, lon } = canvasToLatLon(x, y, canvas.width, canvas.height);
    const isLand = isLandCoordinate(lat, lon);

    if (!isLand) {
      const temp = getFieldTemperature(lat, lon, activeDepth);
      setHoverCoord({ lat, lon, temp: Math.round(temp * 10) / 10 });
    } else {
      setHoverCoord(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="card-elevated"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '460px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Map Layer Control Bar */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
          padding: '5px 10px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: 'var(--glow-subtle)'
        }}
      >
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layers size={13} color="var(--accent-cyan)" /> LAYER:
        </span>
        
        <button
          onClick={() => setMapLayer('temperature')}
          className={`nav-tab ${mapLayer === 'temperature' ? 'active' : ''}`}
          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
        >
          <Thermometer size={12} /> Temp T(z)
        </button>

        <button
          onClick={() => setMapLayer('uncertainty')}
          className={`nav-tab ${mapLayer === 'uncertainty' ? 'active' : ''}`}
          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
        >
          <ShieldAlert size={12} /> Uncertainty (±σ)
        </button>

        <button
          onClick={() => setMapLayer('argo')}
          className={`nav-tab ${mapLayer === 'argo' ? 'active' : ''}`}
          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
        >
          <Crosshair size={12} /> ARGO Floats
        </button>

        <button
          onClick={() => setMapLayer('currents')}
          className={`nav-tab ${mapLayer === 'currents' ? 'active' : ''}`}
          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
        >
          <Compass size={12} /> Surface Currents
        </button>

        <button
          onClick={() => setMapLayer('winds')}
          className={`nav-tab ${mapLayer === 'winds' ? 'active' : ''}`}
          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
        >
          <Wind size={12} /> Wind Stress
        </button>
      </div>

      {/* Floating Hover Coordinates HUD */}
      {hoverCoord && (
        <div
          className="glass-panel mono"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-active)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{hoverCoord.lat.toFixed(2)}°N, {hoverCoord.lon.toFixed(2)}°E</span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
            {hoverCoord.temp}°C
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>@{activeDepth}m</span>
        </div>
      )}

      {/* Main Map Canvas */}
      <canvas
        ref={canvasRef}
        width={840}
        height={500}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverCoord(null)}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'crosshair',
          display: 'block'
        }}
      />

      {/* Bottom Thermal Legend Bar with Physical Units */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 10,
          padding: '6px 12px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          minWidth: '240px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-secondary)' }}>
          <span>{mapLayer === 'uncertainty' ? '0.1°C (High Conf)' : '4.0°C (Abyssal)'}</span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {mapLayer === 'uncertainty' ? '±σ Total Uncertainty (°C)' : `Thermal Layer T(${activeDepth}m) [°C]`}
          </strong>
          <span>{mapLayer === 'uncertainty' ? '1.8°C (Low Conf)' : '32.0°C (Warm Pool)'}</span>
        </div>
        <div
          style={{
            height: '7px',
            borderRadius: '3.5px',
            background:
              mapLayer === 'uncertainty'
                ? 'linear-gradient(90deg, #06b6d4 0%, #6366f1 40%, #a855f7 70%, #ec4899 100%)'
                : 'linear-gradient(90deg, rgb(20,24,82) 0%, rgb(30,90,180) 20%, rgb(16,185,129) 45%, rgb(234,179,8) 70%, rgb(249,115,22) 85%, rgb(239,68,68) 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        />
      </div>

      {/* Quick Region Focus Presets */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          zIndex: 10,
          display: 'flex',
          gap: '6px'
        }}
      >
        <button
          onClick={() => setSelectedLocation(15.0, 68.0)}
          className="btn-secondary"
          style={{ fontSize: '0.7rem', padding: '4px 8px' }}
          title="Focus Central Arabian Sea"
        >
          Arabian Sea
        </button>
        <button
          onClick={() => setSelectedLocation(14.5, 88.0)}
          className="btn-secondary"
          style={{ fontSize: '0.7rem', padding: '4px 8px' }}
          title="Focus Central Bay of Bengal"
        >
          Bay of Bengal
        </button>
        <button
          onClick={() => setSelectedLocation(5.5, 78.0)}
          className="btn-secondary"
          style={{ fontSize: '0.7rem', padding: '4px 8px' }}
          title="Focus Equatorial Indian Ocean"
        >
          Equatorial IO
        </button>
      </div>

    </div>
  );
};
