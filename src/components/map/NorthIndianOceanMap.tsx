// Interactive North Indian Ocean 2D Canvas Bathymetry & Thermal Engine
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useOcean } from '../../context/OceanContext';
import { STANDARD_DEPTH_LEVELS, ArgoFloatObservation } from '../../types/ocean';
import { getThermalColor, getUncertaintyColor } from '../../utils/oceanPhysics';
import { oceanDataManager } from '../../services/data/oceanDataProvider';
import {
  Layers,
  Eye,
  Crosshair,
  Maximize2,
  RotateCcw,
  Thermometer,
  ShieldAlert,
  Wind,
  Compass
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
    theme,
    isTourActive
  } = useOcean();

  const [hoverCoord, setHoverCoord] = useState<{ lat: number; lon: number; temp?: number } | null>(null);
  const [argoFloats, setArgoFloats] = useState<ArgoFloatObservation[]>([]);
  const [selectedFloat, setSelectedFloat] = useState<ArgoFloatObservation | null>(null);

  // NIO Bounding Box
  const MIN_LAT = 4.0;
  const MAX_LAT = 26.0;
  const MIN_LON = 54.0;
  const MAX_LON = 96.0;

  // Fetch ARGO floats
  useEffect(() => {
    const fetchFloats = async () => {
      const floats = await oceanDataManager.getProvider().getArgoBenchmarkProfiles();
      setArgoFloats(floats);
    };
    fetchFloats();
  }, []);

  // Coordinate Conversion Helpers
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

  // Check land geometry polygon approximations
  const isLandCoordinate = useCallback((lat: number, lon: number) => {
    // Peninsular India & Gujarat
    if (lat >= 8.0 && lat <= 26.0) {
      if (lat >= 8.0 && lat <= 13.0 && lon >= 75.2 && lon <= 80.2) return true;
      if (lat > 13.0 && lat <= 18.0 && lon >= 73.2 && lon <= 84.0) return true;
      if (lat > 18.0 && lat <= 23.5 && lon >= 69.5 && lon <= 88.5) return true;
      if (lat > 23.5 && lon >= 68.0 && lon <= 92.0) return true;
    }
    // Sri Lanka
    if (lat >= 5.8 && lat <= 9.8 && lon >= 79.5 && lon <= 82.0) return true;
    // Arabian Peninsula & Iran/Pakistan Coast
    if (lat >= 12.0 && lon <= 58.5) return true;
    if (lat >= 22.0 && lon <= 68.0) return true;
    // Myanmar / Thailand
    if (lat >= 10.0 && lon >= 94.5) return true;
    if (lat >= 16.0 && lon >= 93.8) return true;

    return false;
  }, []);

  // Synthesize temperature at any coordinate for smooth canvas field rendering
  const getFieldTemperature = useCallback((lat: number, lon: number, depth: number) => {
    const isBayOfBengal = lon > 80.0 && lat > 8.0;
    const isArabianSea = lon < 77.0 && lat > 8.0;
    const isSomali = lon < 60.0 && lat < 16.0;

    let sst = 29.2;
    let thermoclineCenter = 120;
    let sharpness = 0.022;
    let deepT = 5.8;

    if (isBayOfBengal) {
      sst = 30.2 - ((lat - 8) / 14) * 0.8;
      thermoclineCenter = 75;
      sharpness = 0.035;
      deepT = 6.2;
    } else if (isSomali) {
      sst = 26.4 + Math.sin(lat * 0.5) * 1.2;
      thermoclineCenter = 45;
      sharpness = 0.040;
      deepT = 5.4;
    } else if (isArabianSea) {
      sst = 28.8 - ((lat - 8) / 16) * 1.2;
      thermoclineCenter = 135;
      sharpness = 0.020;
      deepT = 5.9;
    } else {
      sst = 29.8 + Math.sin(lon * 0.2) * 0.4;
      thermoclineCenter = 110;
      sharpness = 0.025;
      deepT = 5.8;
    }

    const logistic = 1 / (1 + Math.exp(sharpness * (depth - thermoclineCenter)));
    return deepT + (sst - deepT) * logistic;
  }, []);

  const getFieldUncertainty = useCallback((lat: number, lon: number, depth: number) => {
    const isBayOfBengal = lon > 80.0 && lat > 8.0;
    const thermoclineCenter = isBayOfBengal ? 75 : 125;
    const thermoclineGradFactor = Math.exp(-Math.pow((depth - thermoclineCenter) / 40, 2)) * 0.35;
    const baseDepthUncertainty = 0.15 + (depth / 1000) * 0.95;
    return baseDepthUncertainty + thermoclineGradFactor;
  }, []);

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.03;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear Canvas
      ctx.fillStyle = theme === 'dark' ? '#040914' : '#f1f5f9';
      ctx.fillRect(0, 0, width, height);

      // 2. Render Thermal / Uncertainty Ocean Raster Grid (Coarse 8px grid interpolated)
      const cellSize = 10;
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellSize;
          const y = r * cellSize;
          const { lat, lon } = canvasToLatLon(x + cellSize / 2, y + cellSize / 2, width, height);

          const isLand = isLandCoordinate(lat, lon);
          if (isLand) {
            ctx.fillStyle = theme === 'dark' ? '#111c30' : '#cbd5e1';
            ctx.fillRect(x, y, cellSize, cellSize);
          } else {
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

      // 3. Draw Geographic Grid Lines (Lat/Lon)
      ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Latitudes: 5, 10, 15, 20, 25
      [5, 10, 15, 20, 25].forEach((lat) => {
        const { y } = latLonToCanvas(lat, MIN_LON, width, height);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.fillStyle = theme === 'dark' ? '#64748b' : '#64748b';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`${lat}°N`, 8, y - 4);
      });

      // Longitudes: 60, 70, 80, 90
      [60, 70, 80, 90].forEach((lon) => {
        const { x } = latLonToCanvas(MIN_LAT, lon, width, height);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        ctx.fillStyle = theme === 'dark' ? '#64748b' : '#64748b';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`${lon}°E`, x + 4, height - 8);
      });
      ctx.setLineDash([]); // Reset dash

      // 4. Region Text Labels
      ctx.font = 'bold 12px Inter';
      ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(15, 23, 42, 0.4)';
      const arabianSeaPos = latLonToCanvas(15.0, 64.0, width, height);
      ctx.fillText('ARABIAN SEA', arabianSeaPos.x, arabianSeaPos.y);

      const bobPos = latLonToCanvas(15.0, 88.0, width, height);
      ctx.fillText('BAY OF BENGAL', bobPos.x, bobPos.y);

      const eqPos = latLonToCanvas(5.5, 78.0, width, height);
      ctx.fillText('EQUATORIAL INDIAN OCEAN', eqPos.x, eqPos.y);

      // 5. Draw Animated Surface Currents / Wind Vectors (if selected)
      if (mapLayer === 'currents' || mapLayer === 'winds') {
        ctx.strokeStyle = mapLayer === 'currents' ? 'rgba(0, 242, 254, 0.65)' : 'rgba(245, 158, 11, 0.65)';
        ctx.lineWidth = 1.5;

        for (let lat = 6; lat <= 22; lat += 2.5) {
          for (let lon = 58; lon <= 92; lon += 3.5) {
            if (isLandCoordinate(lat, lon)) continue;
            const { x, y } = latLonToCanvas(lat, lon, width, height);
            const angle = Math.sin(lat * 0.3 + lon * 0.2 + time) * 0.8 + (lon > 80 ? 0.4 : -0.2);
            const len = 14 + Math.sin(time + lat) * 4;

            ctx.beginPath();
            ctx.moveTo(x, y);
            const x2 = x + Math.cos(angle) * len;
            const y2 = y + Math.sin(angle) * len;
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Arrow head
            ctx.beginPath();
            ctx.arc(x2, y2, 2, 0, Math.PI * 2);
            ctx.fillStyle = mapLayer === 'currents' ? '#00f2fe' : '#f59e0b';
            ctx.fill();
          }
        }
      }

      // 6. Draw In-Situ ARGO Float Markers
      if (mapLayer === 'argo' || mapLayer === 'temperature' || mapLayer === 'uncertainty') {
        argoFloats.forEach((float) => {
          const { x, y } = latLonToCanvas(float.lat, float.lon, width, height);

          // Pulsing halo
          const pulseRadius = 8 + Math.sin(time * 3 + float.cycleNumber) * 4;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
          ctx.fill();

          // Float Core Marker (Emerald Diamond)
          ctx.beginPath();
          ctx.moveTo(x, y - 6);
          ctx.lineTo(x + 6, y);
          ctx.lineTo(x, y + 6);
          ctx.lineTo(x - 6, y);
          ctx.closePath();
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Float Label
          ctx.font = 'bold 9px JetBrains Mono';
          ctx.fillStyle = theme === 'dark' ? '#10b981' : '#047857';
          ctx.fillText(`WMO ${float.wmoId}`, x + 8, y + 3);
        });
      }

      // 7. Draw Selected Target Crosshair Location Marker
      const targetPos = latLonToCanvas(selectedLocation.lat, selectedLocation.lon, width, height);

      // Glowing outer ring
      ctx.beginPath();
      ctx.arc(targetPos.x, targetPos.y, 14, 0, Math.PI * 2);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Center crosshair lines
      ctx.beginPath();
      ctx.moveTo(targetPos.x - 20, targetPos.y);
      ctx.lineTo(targetPos.x - 6, targetPos.y);
      ctx.moveTo(targetPos.x + 6, targetPos.y);
      ctx.lineTo(targetPos.x + 20, targetPos.y);
      ctx.moveTo(targetPos.x, targetPos.y - 20);
      ctx.lineTo(targetPos.x, targetPos.y - 6);
      ctx.moveTo(targetPos.x, targetPos.y + 6);
      ctx.lineTo(targetPos.x, targetPos.y + 20);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(targetPos.x, targetPos.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Target Tooltip Tag
      ctx.fillStyle = theme === 'dark' ? 'rgba(8, 19, 38, 0.92)' : 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1;
      const tagText = `${selectedLocation.lat.toFixed(1)}°N, ${selectedLocation.lon.toFixed(1)}°E`;
      ctx.font = 'bold 10px JetBrains Mono';
      const textWidth = ctx.measureText(tagText).width;
      ctx.fillRect(targetPos.x + 12, targetPos.y - 24, textWidth + 14, 18);
      ctx.strokeRect(targetPos.x + 12, targetPos.y - 24, textWidth + 14, 18);
      ctx.fillStyle = theme === 'dark' ? '#00f2fe' : '#0284c7';
      ctx.fillText(tagText, targetPos.x + 18, targetPos.y - 12);

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
    canvasToLatLon,
    latLonToCanvas,
    isLandCoordinate,
    getFieldTemperature,
    getFieldUncertainty
  ]);

  // Handle Canvas Click to Select Location
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

  // Handle Canvas Mouse Move for Hover Readout
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
        minHeight: '440px',
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
          padding: '6px 12px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--glow-subtle)'
        }}
      >
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layers size={13} color="var(--accent-cyan)" /> LAYER:
        </span>
        
        <button
          onClick={() => setMapLayer('temperature')}
          className={`nav-tab ${mapLayer === 'temperature' ? 'active' : ''}`}
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
        >
          <Thermometer size={13} /> Temp
        </button>

        <button
          onClick={() => setMapLayer('uncertainty')}
          className={`nav-tab ${mapLayer === 'uncertainty' ? 'active' : ''}`}
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
        >
          <ShieldAlert size={13} /> Uncertainty (±σ)
        </button>

        <button
          onClick={() => setMapLayer('argo')}
          className={`nav-tab ${mapLayer === 'argo' ? 'active' : ''}`}
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
        >
          <Crosshair size={13} /> ARGO Floats
        </button>

        <button
          onClick={() => setMapLayer('currents')}
          className={`nav-tab ${mapLayer === 'currents' ? 'active' : ''}`}
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
        >
          <Compass size={13} /> Currents
        </button>

        <button
          onClick={() => setMapLayer('winds')}
          className={`nav-tab ${mapLayer === 'winds' ? 'active' : ''}`}
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
        >
          <Wind size={13} /> Winds
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
        width={780}
        height={480}
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

      {/* Bottom Thermal Legend Bar */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 10,
          padding: '6px 14px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: '220px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
          <span>{mapLayer === 'uncertainty' ? '0.1°C (High Conf)' : '4.0°C (Abyssal)'}</span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {mapLayer === 'uncertainty' ? '±σ Reconstruction Uncertainty' : `Thermal Field @ ${activeDepth}m`}
          </strong>
          <span>{mapLayer === 'uncertainty' ? '1.8°C (Low Conf)' : '32.0°C (Warm Pool)'}</span>
        </div>
        <div
          style={{
            height: '8px',
            borderRadius: '4px',
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
