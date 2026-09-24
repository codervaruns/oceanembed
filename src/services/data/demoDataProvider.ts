// High-Fidelity Demo & Curated Scientific Data Provider
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import {
  DepthLevel,
  STANDARD_DEPTH_LEVELS,
  OceanCoordinate,
  SurfaceVariables,
  SubsurfacePrediction,
  ArgoFloatObservation,
  ArgoValidationMetrics,
  WaterMassCluster,
  AttentionMapData,
  CycloneCaseStudy,
  UpwellingZone
} from '../../types/ocean';
import { IOceanDataProvider, SpatialGridCell } from './IOceanDataProvider';
import { calculateMLD, calculateD20, calculateD26, calculateTCHP, calculateMaxGradient } from '../../utils/oceanPhysics';

export class DemoDataProvider implements IOceanDataProvider {

  public async isLiveModelConnected(): Promise<boolean> {
    return false; // Standalone demo mode
  }

  public async getSurfaceVariables(lat: number, lon: number, _date?: string): Promise<SurfaceVariables> {
    const isBayOfBengal = lon > 80.0 && lat > 8.0;
    const isArabianSea = lon < 77.0 && lat > 8.0;
    const isEquatorial = lat <= 8.0;
    const isSomaliBasin = lon < 60.0 && lat < 16.0;

    let sst = 29.2;
    let sss = 35.5;
    let sla = 8.5;
    let uCurrent = 0.12;
    let vCurrent = -0.08;
    let uWind = -3.8;
    let vWind = 5.2;

    if (isBayOfBengal) {
      // Bay of Bengal: Warmer SST, much lower salinity due to major river discharges (Ganga/Brahmaputra)
      const latFactor = (lat - 8) / 14;
      sst = 30.1 - latFactor * 0.8;
      sss = 33.2 - latFactor * 1.8; // Fresher towards the north
      sla = 14.2 - latFactor * 4.0;
      uCurrent = -0.18 + Math.sin(lat) * 0.1;
      vCurrent = 0.22 + Math.cos(lon) * 0.08;
      uWind = -2.5;
      vWind = 6.4;
    } else if (isSomaliBasin) {
      // Somali Basin: Cold upwelling signature, high winds
      sst = 26.4 + Math.sin(lat * 0.5) * 1.2;
      sss = 35.8;
      sla = -12.4;
      uCurrent = 0.45;
      vCurrent = 0.65;
      uWind = -7.2;
      vWind = 11.4;
    } else if (isArabianSea) {
      // Arabian Sea: High salinity from intense evaporation
      const latFactor = (lat - 8) / 16;
      sst = 28.8 - latFactor * 1.2;
      sss = 36.4 + latFactor * 0.6;
      sla = 4.2 - latFactor * 3.0;
      uCurrent = 0.15;
      vCurrent = -0.12;
      uWind = -4.8;
      vWind = 7.1;
    } else if (isEquatorial) {
      // Equatorial Warm Pool
      sst = 29.8 + Math.sin(lon * 0.2) * 0.4;
      sss = 34.9;
      sla = 12.0;
      uCurrent = 0.35; // Equatorial Jet
      vCurrent = 0.02;
      uWind = -1.8;
      vWind = 2.4;
    }

    // Add subtle deterministic coordinate noise
    const hash = Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453;
    const microNoise = (hash - Math.floor(hash)) * 0.3 - 0.15;

    return {
      sst: Math.round((sst + microNoise) * 10) / 10,
      sss: Math.round((sss + microNoise * 0.5) * 10) / 10,
      sla: Math.round((sla + microNoise * 2) * 10) / 10,
      uCurrent: Math.round((uCurrent + microNoise * 0.1) * 100) / 100,
      vCurrent: Math.round((vCurrent + microNoise * 0.1) * 100) / 100,
      uWind: Math.round((uWind + microNoise * 0.5) * 10) / 10,
      vWind: Math.round((vWind + microNoise * 0.5) * 10) / 10,
    };
  }

  public async runOceanEmbedInference(lat: number, lon: number, date?: string): Promise<SubsurfacePrediction> {
    const surface = await this.getSurfaceVariables(lat, lon, date);
    const location = this.resolveCoordinate(lat, lon);

    // Synthesize 15-level vertical profile based on surface boundary conditions and regional dynamics
    const temperatures: number[] = [];
    const uncertainties: number[] = [];

    const isBayOfBengal = location.subRegion === 'Bay of Bengal' || location.subRegion === 'Andaman Sea';
    const isArabianSea = location.subRegion === 'Arabian Sea' || location.subRegion === 'Lakshadweep Sea';
    const isSomali = location.subRegion === 'Somali Basin';

    // Thermocline depth parameterization
    let thermoclineCenter = 120; // meters
    let thermoclineSharpness = 0.022; // steepness
    let deepWaterTemp = 5.8; // 1000m abyssal temperature

    if (isBayOfBengal) {
      thermoclineCenter = 75; // Shallow sharp thermocline
      thermoclineSharpness = 0.035;
      deepWaterTemp = 6.2;
    } else if (isSomali) {
      thermoclineCenter = 45; // Upwelling shoaling
      thermoclineSharpness = 0.040;
      deepWaterTemp = 5.4;
    } else if (isArabianSea) {
      thermoclineCenter = 135; // Deeper winter mixed layer
      thermoclineSharpness = 0.020;
      deepWaterTemp = 5.9;
    }

    STANDARD_DEPTH_LEVELS.forEach((depth) => {
      // Sigmoidal / generalized logistic thermal decay: T(z) = T_deep + (T_surf - T_deep) / (1 + exp(k * (z - z0)))
      const logistic = 1 / (1 + Math.exp(thermoclineSharpness * (depth - thermoclineCenter)));
      let tZ = deepWaterTemp + (surface.sst - deepWaterTemp) * logistic;

      // Epistemic uncertainty: increases with depth as surface constraint weakens, with a peak around thermocline gradient
      const thermoclineGradFactor = Math.exp(-Math.pow((depth - thermoclineCenter) / 40, 2)) * 0.35;
      const baseDepthUncertainty = 0.15 + (depth / 1000) * 0.95;
      const sigma = Math.round((baseDepthUncertainty + thermoclineGradFactor) * 100) / 100;

      temperatures.push(Math.round(tZ * 10) / 10);
      uncertainties.push(sigma);
    });

    // Compute derived oceanographic diagnostics
    const mld = calculateMLD(STANDARD_DEPTH_LEVELS, temperatures);
    const d20 = calculateD20(STANDARD_DEPTH_LEVELS, temperatures);
    const d26 = calculateD26(STANDARD_DEPTH_LEVELS, temperatures);
    const tchp = calculateTCHP(STANDARD_DEPTH_LEVELS, temperatures);
    const { gradient: gradientMax, depth: gradientMaxDepth } = calculateMaxGradient(STANDARD_DEPTH_LEVELS, temperatures);

    // Generate deterministic 256-D Latent Embedding Vector preview
    const embedding256D = this.generate256DEmbedding(lat, lon, surface);

    // Find closest co-located ARGO float if nearby
    const argoProfile = this.findClosestArgoFloat(lat, lon, temperatures);

    return {
      location,
      timestamp: date || '2026-05-15T12:00:00Z',
      depths: STANDARD_DEPTH_LEVELS,
      temperatures,
      uncertainties,
      mld,
      d20,
      d26,
      tchp,
      gradientMax,
      gradientMaxDepth,
      embedding256D,
      argoProfile,
      provenance: {
        source: 'demo_curated_grid',
        isIllustrative: true,
        spatialResolution: '0.25° (~27 km)',
        modelChecksum: 'oe-transformer-v1.4-nio'
      }
    };
  }

  public async getSpatialGrid(depth: DepthLevel, _date?: string): Promise<SpatialGridCell[]> {
    const grid: SpatialGridCell[] = [];
    const minLat = 5;
    const maxLat = 24;
    const minLon = 56;
    const maxLon = 94;
    const step = 1.0; // 1-degree resolution for smooth canvas rendering

    for (let lat = minLat; lat <= maxLat; lat += step) {
      for (let lon = minLon; lon <= maxLon; lon += step) {
        const isLand = this.checkIfLand(lat, lon);
        if (isLand) {
          grid.push({
            lat,
            lon,
            depth,
            temperature: 0,
            uncertainty: 0,
            isLand: true,
            bathymetry: 0
          });
          continue;
        }

        const surface = await this.getSurfaceVariables(lat, lon);
        const prediction = await this.runOceanEmbedInference(lat, lon);
        const depthIndex = STANDARD_DEPTH_LEVELS.indexOf(depth);
        const temp = depthIndex >= 0 ? prediction.temperatures[depthIndex] : surface.sst;
        const unc = depthIndex >= 0 ? prediction.uncertainties[depthIndex] : 0.2;

        grid.push({
          lat,
          lon,
          depth,
          temperature: temp,
          uncertainty: unc,
          isLand: false,
          bathymetry: this.estimateBathymetry(lat, lon)
        });
      }
    }
    return grid;
  }

  public async getArgoBenchmarkProfiles(): Promise<ArgoFloatObservation[]> {
    return [
      {
        wmoId: '2902748',
        cycleNumber: 142,
        timestamp: '2026-05-14T08:30:00Z',
        lat: 14.5,
        lon: 88.2,
        deltaHours: 3.8,
        depths: STANDARD_DEPTH_LEVELS,
        temperatures: [29.8, 29.7, 29.5, 29.1, 27.4, 22.8, 18.2, 15.6, 13.2, 11.4, 10.1, 8.4, 7.2, 6.1, 5.8],
        qualityFlag: 'Passed-QC',
        institution: 'INCOIS / Argo India'
      },
      {
        wmoId: '2902890',
        cycleNumber: 88,
        timestamp: '2026-05-15T02:15:00Z',
        lat: 16.0,
        lon: 66.5,
        deltaHours: 1.5,
        depths: STANDARD_DEPTH_LEVELS,
        temperatures: [28.6, 28.5, 28.4, 28.1, 27.8, 26.2, 23.4, 19.8, 15.2, 13.0, 11.5, 9.6, 8.1, 6.8, 5.9],
        qualityFlag: 'Realtime-A',
        institution: 'INCOIS / Argo India'
      },
      {
        wmoId: '2903102',
        cycleNumber: 215,
        timestamp: '2026-05-13T18:45:00Z',
        lat: 5.5,
        lon: 76.0,
        deltaHours: 6.2,
        depths: STANDARD_DEPTH_LEVELS,
        temperatures: [30.2, 30.1, 30.0, 29.6, 28.9, 25.1, 20.8, 17.5, 14.1, 12.2, 10.8, 8.9, 7.6, 6.4, 5.7],
        qualityFlag: 'Passed-QC',
        institution: 'JAMSTEC / Argo Japan'
      },
      {
        wmoId: '6903211',
        cycleNumber: 104,
        timestamp: '2026-05-15T10:00:00Z',
        lat: 10.8,
        lon: 72.4,
        deltaHours: 2.1,
        depths: STANDARD_DEPTH_LEVELS,
        temperatures: [29.1, 29.0, 28.8, 28.4, 27.1, 23.9, 19.1, 16.2, 13.8, 11.9, 10.4, 8.8, 7.5, 6.3, 5.8],
        qualityFlag: 'Passed-QC',
        institution: 'INCOIS / NIO Goa'
      }
    ];
  }

  public async getArgoValidationMetrics(): Promise<ArgoValidationMetrics> {
    return {
      totalProfiles: 1420,
      overallRmse: 0.68,
      overallMae: 0.51,
      r2Score: 0.964,
      upperLayerRmse: 0.84, // 0-200m
      deepLayerRmse: 0.46,  // 200-1000m
      regionalRmse: [
        { region: 'Arabian Sea', rmse: 0.65, profileCount: 520 },
        { region: 'Bay of Bengal', rmse: 0.74, profileCount: 480 },
        { region: 'Equatorial Indian Ocean', rmse: 0.58, profileCount: 320 },
        { region: 'Andaman & Lakshadweep', rmse: 0.71, profileCount: 100 }
      ],
      depthWiseResiduals: [
        { depth: 0, meanResidual: 0.04, stdResidual: 0.22, rmse: 0.22 },
        { depth: 10, meanResidual: 0.06, stdResidual: 0.25, rmse: 0.26 },
        { depth: 25, meanResidual: -0.08, stdResidual: 0.31, rmse: 0.32 },
        { depth: 50, meanResidual: -0.14, stdResidual: 0.52, rmse: 0.54 },
        { depth: 75, meanResidual: 0.21, stdResidual: 0.78, rmse: 0.81 },
        { depth: 100, meanResidual: 0.32, stdResidual: 0.89, rmse: 0.95 },
        { depth: 125, meanResidual: 0.28, stdResidual: 0.85, rmse: 0.89 },
        { depth: 150, meanResidual: 0.19, stdResidual: 0.72, rmse: 0.74 },
        { depth: 200, meanResidual: 0.12, stdResidual: 0.58, rmse: 0.59 },
        { depth: 250, meanResidual: 0.08, stdResidual: 0.49, rmse: 0.50 },
        { depth: 300, meanResidual: -0.05, stdResidual: 0.44, rmse: 0.44 },
        { depth: 400, meanResidual: -0.07, stdResidual: 0.39, rmse: 0.40 },
        { depth: 500, meanResidual: 0.04, stdResidual: 0.36, rmse: 0.36 },
        { depth: 750, meanResidual: 0.02, stdResidual: 0.31, rmse: 0.31 },
        { depth: 1000, meanResidual: 0.01, stdResidual: 0.28, rmse: 0.28 }
      ]
    };
  }

  public async getWaterMassClusters(): Promise<WaterMassCluster[]> {
    return [
      {
        id: 'ashsw',
        name: 'Arabian Sea High-Salinity Water (ASHSW)',
        color: '#f97316',
        tsneX: 42.5,
        tsneY: -18.2,
        salinityMean: 36.6,
        tempMean: 27.8,
        description: 'Formed by high evaporative flux in the northern Arabian Sea. High salinity, moderate thermocline depth, subducted into central NIO.',
        samplePoints: [
          { lat: 18.5, lon: 64.0, label: 'North Arabian Basin' },
          { lat: 15.0, lon: 68.0, label: 'Central Arabian Sea' }
        ]
      },
      {
        id: 'boblsw',
        name: 'Bay of Bengal Low-Salinity Plume (BOBLSW)',
        color: '#06b6d4',
        tsneX: -38.4,
        tsneY: 24.1,
        salinityMean: 32.8,
        tempMean: 29.6,
        description: 'Dominated by freshwater discharge from the Ganga-Brahmaputra system. Forms a shallow buoyant barrier layer and steep thermocline.',
        samplePoints: [
          { lat: 18.0, lon: 89.5, label: 'North Bay of Bengal' },
          { lat: 14.0, lon: 86.0, label: 'Central Bay of Bengal' }
        ]
      },
      {
        id: 'eiowp',
        name: 'Equatorial Indian Ocean Warm Pool (EIOWP)',
        color: '#ef4444',
        tsneX: 12.8,
        tsneY: 36.7,
        salinityMean: 34.8,
        tempMean: 30.1,
        description: 'Characterized by high sea surface temperature (>29.5°C), high sea level anomalies, and strong zonal equatorial currents.',
        samplePoints: [
          { lat: 5.0, lon: 78.0, label: 'South of Sri Lanka' },
          { lat: 6.0, lon: 88.0, label: 'East Equatorial IO' }
        ]
      },
      {
        id: 'somupw',
        name: 'Somali Current Upwelling Water (SCUW)',
        color: '#10b981',
        tsneX: -22.1,
        tsneY: -41.3,
        salinityMean: 35.7,
        tempMean: 24.8,
        description: 'Southwest monsoon driven coastal upwelling bringing cold, nutrient-rich subsurface water to the euphotic zone.',
        samplePoints: [
          { lat: 10.0, lon: 54.0, label: 'Socotra Passage' },
          { lat: 14.5, lon: 56.5, label: 'Oman Coast' }
        ]
      }
    ];
  }

  public async getAttentionData(): Promise<AttentionMapData> {
    return {
      variableWeights: [
        { variable: 'SST (Sea Surface Temperature)', weight: 0.32, description: 'Direct thermal boundary condition for the mixed layer' },
        { variable: 'SLA (Sea Level Anomaly)', weight: 0.28, description: 'Baroclinic proxy for thermocline displacement and upper-ocean heat content' },
        { variable: 'SSS (Sea Surface Salinity)', weight: 0.18, description: 'Crucial for barrier layer dynamics and vertical density stratification' },
        { variable: 'Winds (U/V Wind Stress)', weight: 0.12, description: 'Drives Ekman suction, vertical mixing, and thermocline pumping' },
        { variable: 'Currents (U/V Geostrophic)', weight: 0.10, description: 'Advective heat transport across major basin boundaries' }
      ],
      depthQueryAttention: [
        { depth: 0, surfaceAttention: { sst: 0.72, sss: 0.12, sla: 0.08, currents: 0.04, winds: 0.04 } },
        { depth: 50, surfaceAttention: { sst: 0.44, sss: 0.22, sla: 0.20, currents: 0.08, winds: 0.06 } },
        { depth: 100, surfaceAttention: { sst: 0.22, sss: 0.18, sla: 0.38, currents: 0.12, winds: 0.10 } },
        { depth: 150, surfaceAttention: { sst: 0.14, sss: 0.14, sla: 0.42, currents: 0.16, winds: 0.14 } },
        { depth: 300, surfaceAttention: { sst: 0.08, sss: 0.10, sla: 0.48, currents: 0.18, winds: 0.16 } },
        { depth: 500, surfaceAttention: { sst: 0.05, sss: 0.08, sla: 0.52, currents: 0.20, winds: 0.15 } },
        { depth: 1000, surfaceAttention: { sst: 0.03, sss: 0.06, sla: 0.55, currents: 0.22, winds: 0.14 } }
      ]
    };
  }

  public async getDisasterCaseStudies(): Promise<CycloneCaseStudy[]> {
    return [
      {
        id: 'biparjoy_2023',
        cycloneName: 'Extremely Severe Cyclonic Storm BIPARJOY',
        year: 2023,
        category: 'ESCS (Category 3 equivalent)',
        basin: 'Arabian Sea',
        trackPoints: [
          { lat: 12.1, lon: 66.0, date: '2023-06-06', intensityKt: 45, tchp: 88.5 },
          { lat: 14.2, lon: 66.2, date: '2023-06-08', intensityKt: 75, tchp: 94.2 },
          { lat: 17.5, lon: 67.4, date: '2023-06-11', intensityKt: 90, tchp: 102.0 },
          { lat: 21.0, lon: 68.1, date: '2023-06-14', intensityKt: 70, tchp: 54.1 }
        ],
        preStormThermalProfile: {
          depths: STANDARD_DEPTH_LEVELS,
          temperatures: [30.4, 30.2, 30.1, 29.8, 29.1, 26.5, 22.1, 18.4, 15.1, 13.2, 11.6, 9.4, 8.0, 6.7, 5.8]
        },
        postStormThermalProfile: {
          depths: STANDARD_DEPTH_LEVELS,
          temperatures: [27.2, 27.1, 27.0, 26.9, 26.4, 25.2, 21.4, 18.1, 14.9, 13.1, 11.5, 9.3, 7.9, 6.6, 5.8]
        },
        sstCoolingWake: 3.2,
        subsurfaceHeatDepletion: 38.4,
        description: 'Prolonged slow translation over the central Arabian Sea led to intense ocean vertical mixing, deepening the mixed layer and cooling the upper 50m by over 3°C.'
      },
      {
        id: 'amphan_2020',
        cycloneName: 'Super Cyclonic Storm AMPHAN',
        year: 2020,
        category: 'Super Cyclone (Category 5 equivalent)',
        basin: 'Bay of Bengal',
        trackPoints: [
          { lat: 11.0, lon: 86.5, date: '2020-05-16', intensityKt: 55, tchp: 112.4 },
          { lat: 13.5, lon: 86.4, date: '2020-05-17', intensityKt: 110, tchp: 124.0 },
          { lat: 16.5, lon: 86.8, date: '2020-05-18', intensityKt: 140, tchp: 118.6 },
          { lat: 21.6, lon: 88.3, date: '2020-05-20', intensityKt: 85, tchp: 62.0 }
        ],
        preStormThermalProfile: {
          depths: STANDARD_DEPTH_LEVELS,
          temperatures: [31.2, 31.0, 30.8, 30.2, 28.9, 24.2, 19.4, 16.1, 13.8, 12.0, 10.5, 8.7, 7.4, 6.2, 5.7]
        },
        postStormThermalProfile: {
          depths: STANDARD_DEPTH_LEVELS,
          temperatures: [28.4, 28.3, 28.1, 27.8, 27.2, 23.5, 19.0, 15.8, 13.6, 11.9, 10.4, 8.6, 7.3, 6.2, 5.7]
        },
        sstCoolingWake: 2.8,
        subsurfaceHeatDepletion: 46.2,
        description: 'Extremely high pre-existing Tropical Cyclone Heat Potential (>120 kJ/cm²) in the central Bay of Bengal triggered explosive rapid intensification in under 24 hours.'
      }
    ];
  }

  public async getUpwellingZones(): Promise<UpwellingZone[]> {
    return [
      {
        id: 'upw_kerala',
        name: 'Southwest Coast Upwelling Zone (Kerala / Malabar)',
        lat: 9.5,
        lon: 75.8,
        verticalGradient: 5.2,
        thermoclineDepth: 22,
        pfzStatus: 'High Activity',
        chlorophyllProxy: '4.8 mg/m³ (High Bloom)',
        summary: 'Equatorward coastal wind stress triggers offshore Ekman transport, shoaling the nutrient-rich thermocline to 22m and creating high-density pelagic fishing zones.'
      },
      {
        id: 'upw_oman',
        name: 'Oman / Ras al Hadd Upwelling Jet',
        lat: 19.2,
        lon: 58.4,
        verticalGradient: 6.4,
        thermoclineDepth: 18,
        pfzStatus: 'High Activity',
        chlorophyllProxy: '6.2 mg/m³ (Extense Bloom)',
        summary: 'Findlater Jet driven intense upwelling system with steep vertical temperature gradient and cold surface thermal fronts.'
      },
      {
        id: 'upw_tamilnadu',
        name: 'Southeast Coast (Coromandel / Palk Strait)',
        lat: 10.2,
        lon: 80.2,
        verticalGradient: 3.8,
        thermoclineDepth: 38,
        pfzStatus: 'Moderate',
        chlorophyllProxy: '2.4 mg/m³',
        summary: 'Seasonal coastal divergence bringing sub-surface water upwards, supporting demersal and coastal pelagic fisheries.'
      }
    ];
  }

  // Helper Methods
  private resolveCoordinate(lat: number, lon: number): OceanCoordinate {
    let subRegion: OceanCoordinate['subRegion'] = 'Equatorial Indian Ocean';
    let regionName = 'North Indian Ocean';

    if (lon > 80.0 && lat > 8.0) {
      if (lon > 91.0) {
        subRegion = 'Andaman Sea';
        regionName = 'Andaman Sea Basin';
      } else {
        subRegion = 'Bay of Bengal';
        regionName = 'Central Bay of Bengal';
      }
    } else if (lon < 77.0 && lat > 8.0) {
      if (lon < 60.0 && lat < 16.0) {
        subRegion = 'Somali Basin';
        regionName = 'Western Somali Basin';
      } else if (lat < 13.0 && lon > 71.0) {
        subRegion = 'Lakshadweep Sea';
        regionName = 'Lakshadweep Sea Basin';
      } else {
        subRegion = 'Arabian Sea';
        regionName = 'Central Arabian Sea';
      }
    } else {
      subRegion = 'Equatorial Indian Ocean';
      regionName = 'Equatorial Indian Ocean Warm Pool';
    }

    return {
      lat: Math.round(lat * 100) / 100,
      lon: Math.round(lon * 100) / 100,
      regionName,
      subRegion,
      bathymetryDepth: this.estimateBathymetry(lat, lon)
    };
  }

  private generate256DEmbedding(lat: number, lon: number, surface: SurfaceVariables): number[] {
    const vector: number[] = [];
    // Deterministic pseudo-random seed based on coordinates and physics
    const seed = lat * 17.1 + lon * 31.3 + surface.sst * 7.7 + surface.sss * 13.2;
    for (let i = 0; i < 256; i++) {
      const v = Math.sin(seed + i * 0.18) * Math.cos((i * 0.31) + lat * 0.1);
      vector.push(Math.round(v * 1000) / 1000);
    }
    return vector;
  }

  private findClosestArgoFloat(lat: number, lon: number, predictedTemps: number[]): ArgoFloatObservation | undefined {
    // Check if there is an in-situ float within 1.5 degrees
    const floats = [
      { wmoId: '2902748', lat: 14.5, lon: 88.2, cycle: 142, deltaH: 3.8 },
      { wmoId: '2902890', lat: 16.0, lon: 66.5, cycle: 88, deltaH: 1.5 },
      { wmoId: '2903102', lat: 5.5, lon: 76.0, cycle: 215, deltaH: 6.2 },
      { wmoId: '6903211', lat: 10.8, lon: 72.4, cycle: 104, deltaH: 2.1 }
    ];

    for (const f of floats) {
      const dist = Math.sqrt(Math.pow(lat - f.lat, 2) + Math.pow(lon - f.lon, 2));
      if (dist < 1.8) {
        // Synthesize ARGO profile close to prediction with realistic sensor delta
        const argoTemps = predictedTemps.map((t, idx) => {
          const depth = STANDARD_DEPTH_LEVELS[idx];
          const sensorDelta = (Math.sin(depth * 0.05 + f.cycle) * 0.4) + (depth === 100 ? 0.35 : 0.05);
          return Math.round((t + sensorDelta) * 10) / 10;
        });

        return {
          wmoId: f.wmoId,
          cycleNumber: f.cycle,
          timestamp: '2026-05-15T06:00:00Z',
          lat: f.lat,
          lon: f.lon,
          deltaHours: f.deltaH,
          depths: STANDARD_DEPTH_LEVELS,
          temperatures: argoTemps,
          qualityFlag: 'Passed-QC',
          institution: 'INCOIS / Argo India'
        };
      }
    }
    return undefined;
  }

  private checkIfLand(lat: number, lon: number): boolean {
    // Approximate land polygon bounding checks for Indian Subcontinent, Arabian Peninsula, and Indochina
    // India Peninsular Triangle
    if (lat >= 8.0 && lat <= 24.0) {
      // West coast approximation: lon between 69.0 and 77.0
      // East coast approximation: lon between 78.0 and 88.0
      if (lat >= 8.0 && lat <= 13.0 && lon >= 75.5 && lon <= 80.0) return true; // South India
      if (lat > 13.0 && lat <= 18.0 && lon >= 73.5 && lon <= 83.5) return true; // Central Peninsula
      if (lat > 18.0 && lat <= 24.0 && lon >= 70.0 && lon <= 87.5) return true; // North India / Gujarat
    }
    // Sri Lanka
    if (lat >= 5.8 && lat <= 9.8 && lon >= 79.5 && lon <= 82.0) return true;
    // Arabian Peninsula
    if (lat >= 12.0 && lat <= 25.0 && lon >= 50.0 && lon <= 58.0) return true;
    if (lat >= 22.0 && lon <= 62.0) return true;
    // Myanmar / Thailand / Malay Peninsula
    if (lat >= 10.0 && lat <= 25.0 && lon >= 94.0) return true;
    if (lat >= 16.0 && lon >= 94.5) return true;

    return false;
  }

  private estimateBathymetry(lat: number, lon: number): number {
    // Deep basin default
    if (lat <= 8.0) return 4200; // Central Indian Basin
    if (lon < 75.0) return 3800; // Arabian Basin
    if (lon > 82.0) return 3200; // Bay of Bengal Basin
    return 2400; // Ridge / slope
  }
}
