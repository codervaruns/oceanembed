// Rigorous Oceanographic Physics, TEOS-10 Approximations & Derived Diagnostic Engines
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import { DepthLevel, STANDARD_DEPTH_LEVELS } from '../types/ocean';

// Physical Constants
export const GRAVITY = 9.81; // m/s²
export const REF_SEAWATER_DENSITY = 1025.0; // kg/m³
export const SEAWATER_HEAT_CAPACITY = 3993.0; // J / (kg · °C)
export const JOULE_TO_KJ_PER_CM2 = 1e-7; // 1 J/m² = 1e-7 kJ/cm²
export const JOULE_TO_GJ_PER_M2 = 1e-9; // 1 J/m² = 1e-9 GJ/m²

/**
 * Seawater potential density approximation (UNESCO 1983 / TEOS-10 1-bar polynomial).
 * Inputs: Temperature T (°C), Practical Salinity S (PSU), Depth z (m).
 * Returns: Density rho in kg/m³.
 */
export function calculateSeawaterDensity(T: number, S: number, z: number): number {
  // Pressure in dbar ~ depth in meters
  const p = z;
  // Pure water density at atmospheric pressure
  const rhow = 999.842594 + 6.793952e-2 * T - 9.095290e-3 * Math.pow(T, 2) +
    1.001685e-4 * Math.pow(T, 3) - 1.120083e-6 * Math.pow(T, 4) + 6.536332e-9 * Math.pow(T, 5);

  const A = 8.24493e-1 - 4.0899e-3 * T + 7.6438e-5 * Math.pow(T, 2) - 8.2467e-7 * Math.pow(T, 3) + 5.3875e-9 * Math.pow(T, 4);
  const B = -5.72466e-3 + 1.0227e-4 * T - 1.6546e-6 * Math.pow(T, 2);
  const C = 4.8314e-4;

  const rho0 = rhow + A * S + B * Math.pow(S, 1.5) + C * Math.pow(S, 2);
  // Pressure compressibility correction (linearized)
  const compressibility = 4.5e-5;
  return rho0 * (1 + compressibility * p * 0.1);
}

/**
 * Underwater Sound Speed profile calculation using the Mackenzie (1981) Equation.
 * Inputs: Temperature T (°C), Salinity S (PSU), Depth z (m).
 * Returns: Speed of sound c in m/s (critical for SOFAR sound channel & acoustic tomography).
 */
export function calculateSoundSpeed(T: number, S: number, z: number): number {
  return (
    1448.96 +
    4.591 * T -
    5.304e-2 * Math.pow(T, 2) +
    2.374e-4 * Math.pow(T, 3) +
    1.340 * (S - 35) +
    1.630e-2 * z +
    1.675e-7 * Math.pow(z, 2) -
    1.025e-2 * T * (S - 35) -
    7.139e-13 * T * Math.pow(z, 3)
  );
}

/**
 * Calculates Mixed Layer Depth (MLD) in meters.
 * Criterion: Depth where temperature decreases by 0.2°C from surface T(0) (de Boyer Montégut standard).
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
      const fraction = (threshold - t0) / (t1 - t0);
      return Math.round(z0 + fraction * (z1 - z0));
    }
  }
  return depths[depths.length - 1];
}

/**
 * Calculates Isothermal Layer Depth (ILD) in meters (threshold: delta-T = 0.5°C).
 * Used in conjunction with MLD to compute the Barrier Layer Thickness (BLT = ILD - MLD).
 */
export function calculateILD(depths: number[], temperatures: number[]): number {
  if (!temperatures || temperatures.length < 2) return 45;
  const surfaceTemp = temperatures[0];
  const threshold = surfaceTemp - 0.5;

  for (let i = 0; i < depths.length - 1; i++) {
    if (temperatures[i + 1] <= threshold) {
      const z0 = depths[i];
      const z1 = depths[i + 1];
      const t0 = temperatures[i];
      const t1 = temperatures[i + 1];
      if (Math.abs(t1 - t0) < 1e-5) return z0;
      const fraction = (threshold - t0) / (t1 - t0);
      return Math.round(z0 + fraction * (z1 - z0));
    }
  }
  return depths[depths.length - 1];
}

/**
 * Calculates Barrier Layer Thickness (BLT) in meters.
 * Crucial in the Bay of Bengal where salinity stratification creates a thick barrier layer
 * that traps heat and prevents cyclone cooling.
 */
export function calculateBLT(mld: number, ild: number): number {
  return Math.max(0, ild - mld);
}

/**
 * Calculates the depth of the 20°C isotherm (D20), standard thermocline proxy in the NIO.
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
 * Exact linear interpolation for any arbitrary isotherm depth.
 */
export function calculateIsothermDepth(depths: number[], temperatures: number[], targetTemp: number): number {
  if (!temperatures || temperatures.length < 2) return 100;
  if (temperatures[0] < targetTemp) return 0;

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

  let integral = 0;
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

  const tchpJoules = REF_SEAWATER_DENSITY * SEAWATER_HEAT_CAPACITY * integral;
  return Math.round(tchpJoules * JOULE_TO_KJ_PER_CM2 * 10) / 10;
}

/**
 * Calculates Upper Ocean Heat Content integrated to depth Z_max (e.g. 100m, 300m, 700m) in GJ/m².
 */
export function calculateOHC(depths: number[], temperatures: number[], maxDepthLimit: number = 300): number {
  let integral = 0;
  for (let i = 0; i < depths.length - 1; i++) {
    const z0 = depths[i];
    const z1 = depths[i + 1];
    const t0 = temperatures[i];
    const t1 = temperatures[i + 1];

    if (z0 >= maxDepthLimit) break;
    const effectiveZ1 = Math.min(z1, maxDepthLimit);
    const dz = effectiveZ1 - z0;
    const avgTemp = (t0 + t1) / 2;
    integral += avgTemp * dz;
  }
  const ohcJoules = REF_SEAWATER_DENSITY * SEAWATER_HEAT_CAPACITY * integral;
  return Math.round(ohcJoules * JOULE_TO_GJ_PER_M2 * 100) / 100;
}

/**
 * Calculates Brunt-Väisälä buoyancy frequency squared N²(z) = -(g / rho0) * (drho / dz).
 * Peaks sharply at the pycnocline / thermocline core.
 */
export function calculateBruntVaisala(
  depths: number[],
  temperatures: number[],
  salinityProfile: number[]
): { depths: number[]; n2: number[]; maxN2: number; pycnoclineDepth: number } {
  const n2Arr: number[] = [];
  let maxN2 = 0;
  let pycnoclineDepth = 100;

  for (let i = 0; i < depths.length - 1; i++) {
    const z0 = depths[i];
    const z1 = depths[i + 1];
    const dz = z1 - z0;
    if (dz <= 0) continue;

    const rho0 = calculateSeawaterDensity(temperatures[i], salinityProfile[i], z0);
    const rho1 = calculateSeawaterDensity(temperatures[i + 1], salinityProfile[i + 1], z1);
    const drho = rho1 - rho0;

    const n2 = Math.max(0, (GRAVITY / REF_SEAWATER_DENSITY) * (drho / dz));
    n2Arr.push(n2);

    if (n2 > maxN2) {
      maxN2 = n2;
      pycnoclineDepth = Math.round((z0 + z1) / 2);
    }
  }

  // Push last point
  n2Arr.push(n2Arr[n2Arr.length - 1] || 0);

  return {
    depths,
    n2: n2Arr,
    maxN2: Math.round(maxN2 * 1e5) / 1e5,
    pycnoclineDepth
  };
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
    const grad = dt / dz;
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
 * Scientifically calibrated cmocean-thermal colormap mapper for temperature (4°C to 32°C).
 */
export function getThermalColor(temp: number): string {
  const clamped = Math.max(4, Math.min(32, temp));
  const norm = (clamped - 4) / (32 - 4);

  if (norm < 0.15) {
    const t = norm / 0.15;
    return interpolateRgb([20, 24, 82], [30, 90, 180], t);
  } else if (norm < 0.35) {
    const t = (norm - 0.15) / 0.2;
    return interpolateRgb([30, 90, 180], [16, 185, 129], t);
  } else if (norm < 0.6) {
    const t = (norm - 0.35) / 0.25;
    return interpolateRgb([16, 185, 129], [234, 179, 8], t);
  } else if (norm < 0.82) {
    const t = (norm - 0.6) / 0.22;
    return interpolateRgb([234, 179, 8], [249, 115, 22], t);
  } else {
    const t = (norm - 0.82) / 0.18;
    return interpolateRgb([249, 115, 22], [239, 68, 68], t);
  }
}

/**
 * Uncertainty colormap mapper (0.1°C to 1.8°C).
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

/**
 * Salinity colormap mapper (cmocean haline standard 31.0 PSU to 37.0 PSU).
 */
export function getSalinityColor(salinity: number): string {
  const clamped = Math.max(31.0, Math.min(37.0, salinity));
  const norm = (clamped - 31.0) / (37.0 - 31.0);
  return interpolateRgb([56, 189, 248], [147, 51, 234], norm);
}

function interpolateRgb(rgb1: [number, number, number], rgb2: [number, number, number], t: number): string {
  const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
  const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
  const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
