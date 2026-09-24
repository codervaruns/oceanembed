// Oceanographic Physics Utilities & Derived Metric Engines
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import { DepthLevel, STANDARD_DEPTH_LEVELS } from '../types/ocean';

// Physical Constants
const SEA_WATER_DENSITY = 1025.0; // kg/m³
const SEA_WATER_HEAT_CAPACITY = 3993.0; // J / (kg · °C)
const JOULE_TO_KJ_PER_CM2 = 1e-7; // 1 J/m² = 1e-7 kJ/cm²

/**
 * Calculates Mixed Layer Depth (MLD) in meters.
 * Criterion: Depth where temperature decreases by 0.2°C from surface T(0).
 */
export function calculateMLD(depths: number[], temperatures: number[]): number {
  if (!temperatures || temperatures.length < 2) return 30;
  const surfaceTemp = temperatures[0];
  const threshold = surfaceTemp - 0.2;

  for (let i = 0; i < depths.length - 1; i++) {
    if (temperatures[i + 1] <= threshold) {
      const z0 = depths[i];
      const z1 = depths[i + 1];
      const t0 = temperatures[i];
      const t1 = temperatures[i + 1];
      if (Math.abs(t1 - t0) < 1e-5) return z0;
      // Linear interpolation
      const fraction = (threshold - t0) / (t1 - t0);
      return Math.round(z0 + fraction * (z1 - z0));
    }
  }
  return depths[depths.length - 1];
}

/**
 * Calculates the depth of the 20°C isotherm (D20), a standard proxy for thermocline depth in the NIO.
 */
export function calculateD20(depths: number[], temperatures: number[]): number {
  return calculateIsothermDepth(depths, temperatures, 20.0);
}

/**
 * Calculates the depth of the 26°C isotherm (D26), the threshold for tropical cyclone genesis and maintenance.
 */
export function calculateD26(depths: number[], temperatures: number[]): number {
  return calculateIsothermDepth(depths, temperatures, 26.0);
}

/**
 * Linear interpolation to find exact depth of an arbitrary isotherm (e.g. 20°C, 26°C).
 */
export function calculateIsothermDepth(depths: number[], temperatures: number[], targetTemp: number): number {
  if (!temperatures || temperatures.length < 2) return 100;
  if (temperatures[0] < targetTemp) return 0; // Surface is already colder

  for (let i = 0; i < depths.length - 1; i++) {
    const t0 = temperatures[i];
    const t1 = temperatures[i + 1];
    if ((t0 >= targetTemp && t1 <= targetTemp) || (t0 <= targetTemp && t1 >= targetTemp)) {
      const z0 = depths[i];
      const z1 = depths[i + 1];
      if (Math.abs(t1 - t0) < 1e-5) return z0;
      const fraction = (targetTemp - t0) / (t1 - t0);
      return Math.round(z0 + fraction * (z1 - z0));
    }
  }
  return depths[depths.length - 1];
}

/**
 * Calculates Tropical Cyclone Heat Potential (TCHP) in kJ/cm².
 * Formula: TCHP = rho * Cp * Integral from 0 to D26 of (T(z) - 26) dz
 */
export function calculateTCHP(depths: number[], temperatures: number[]): number {
  const d26 = calculateD26(depths, temperatures);
  if (d26 <= 0) return 0;

  let integral = 0; // in °C · m
  for (let i = 0; i < depths.length - 1; i++) {
    const z0 = depths[i];
    const z1 = depths[i + 1];
    const t0 = temperatures[i];
    const t1 = temperatures[i + 1];

    if (z0 >= d26) break;

    const effectiveZ1 = Math.min(z1, d26);
    const effectiveT1 = z1 > d26 ? 26.0 : t1;
    const dz = effectiveZ1 - z0;
    const avgExcessTemp = Math.max(0, (t0 + effectiveT1) / 2 - 26.0);

    integral += avgExcessTemp * dz;
  }

  const tchpJoules = SEA_WATER_DENSITY * SEA_WATER_HEAT_CAPACITY * integral;
  const tchpKJcm2 = tchpJoules * JOULE_TO_KJ_PER_CM2;
  return Math.round(tchpKJcm2 * 10) / 10;
}

/**
 * Calculates maximum vertical temperature gradient dT/dz and the depth where it occurs.
 */
export function calculateMaxGradient(depths: number[], temperatures: number[]): { gradient: number; depth: number } {
  let maxGrad = 0;
  let maxDepth = 100;

  for (let i = 0; i < depths.length - 1; i++) {
    const dz = depths[i + 1] - depths[i];
    const dt = Math.abs(temperatures[i + 1] - temperatures[i]);
    const grad = dt / dz; // °C per meter
    if (grad > maxGrad) {
      maxGrad = grad;
      maxDepth = Math.round((depths[i] + depths[i + 1]) / 2);
    }
  }
  return {
    gradient: Math.round(maxGrad * 1000) / 1000,
    depth: maxDepth
  };
}

/**
 * Color mapper for ocean thermal gradient (cmocean thermal calibrated).
 * Maps temperature (typically 4°C to 32°C in NIO) to hex color.
 */
export function getThermalColor(temp: number): string {
  // Clamped bounds for North Indian Ocean (4°C abyssal to 32°C equatorial warm pool)
  const clamped = Math.max(4, Math.min(32, temp));
  const norm = (clamped - 4) / (32 - 4); // 0 to 1

  // 6-stop scientific colormap
  if (norm < 0.15) {
    // 4 - 8.2°C: Deep Indigo to Cerulean Blue
    const t = norm / 0.15;
    return interpolateRgb([20, 24, 82], [30, 90, 180], t);
  } else if (norm < 0.35) {
    // 8.2 - 13.8°C: Cerulean Blue to Teal/Emerald
    const t = (norm - 0.15) / 0.2;
    return interpolateRgb([30, 90, 180], [16, 185, 129], t);
  } else if (norm < 0.6) {
    // 13.8 - 20.8°C: Emerald to Yellow Gold
    const t = (norm - 0.35) / 0.25;
    return interpolateRgb([16, 185, 129], [234, 179, 8], t);
  } else if (norm < 0.82) {
    // 20.8 - 27°C: Yellow Gold to Amber Orange
    const t = (norm - 0.6) / 0.22;
    return interpolateRgb([234, 179, 8], [249, 115, 22], t);
  } else {
    // 27 - 32°C: Amber Orange to Coral Crimson
    const t = (norm - 0.82) / 0.18;
    return interpolateRgb([249, 115, 22], [239, 68, 68], t);
  }
}

/**
 * Color mapper for Bayesian uncertainty (0.1°C to 1.8°C).
 * Low uncertainty = soft cyan/teal, High uncertainty = deep violet/magenta.
 */
export function getUncertaintyColor(sigma: number): string {
  const clamped = Math.max(0.1, Math.min(1.8, sigma));
  const norm = (clamped - 0.1) / (1.8 - 0.1);

  if (norm < 0.3) {
    return interpolateRgb([6, 182, 212], [99, 102, 241], norm / 0.3);
  } else if (norm < 0.7) {
    return interpolateRgb([99, 102, 241], [168, 85, 247], (norm - 0.3) / 0.4);
  } else {
    return interpolateRgb([168, 85, 247], [236, 72, 153], (norm - 0.7) / 0.3);
  }
}

function interpolateRgb(rgb1: [number, number, number], rgb2: [number, number, number], t: number): string {
  const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
  const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
  const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
