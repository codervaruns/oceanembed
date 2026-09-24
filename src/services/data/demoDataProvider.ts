// High-Fidelity Scientific Data Provider with TEOS-10 & Physical Oceanographic Synthesis
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
import {
  calculateMLD,
  calculateILD,
  calculateBLT,
  calculateD20,
  calculateD26,
  calculateTCHP,
  calculateOHC,
  calculateMaxGradient,
  calculateSeawaterDensity,
  calculateSoundSpeed,
  calculateBruntVaisala
} from '../../utils/oceanPhysics';

export class DemoDataProvider implements IOceanDataProvider {

  public async isLiveModelConnected(): Promise<boolean> {
    return false;
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
      // Bay of Bengal: Freshwater cap from Ganga-Brahmaputra, warmer SST, low SSS
      const latFactor = (lat - 8) / 14;
      sst = 30.2 - latFactor * 0.7;
      sss = 33.4 - latFactor * 2.2;
      sla = 14.5 - latFactor * 4.0;
      uCurrent = -0.16 + Math.sin(lat * 0.4) * 0.1;
      vCurrent = 0.24 + Math.cos(lon * 0.3) * 0.08;
      uWind = -2.8;
      vWind = 6.2;
    } else if (isSomaliBasin) {
      // Somali Basin / Oman Coast: Strong upwelling, cold SST, strong Findlater Jet winds
      sst = 26.2 + Math.sin(lat * 0.5) * 1.4;
      sss = 35.9;
      sla = -14.2;
      uCurrent = 0.52;
      vCurrent = 0.72;
      uWind = -8.4;
      vWind = 12.6;
    } else if (isArabianSea) {
      // Arabian Sea: High evaporation, high salinity (ASHSW formation)
      const latFactor = (lat - 8) / 16;
      sst = 28.9 - latFactor * 1.1;
      sss = 36.5 + latFactor * 0.5;
      sla = 4.8 - latFactor * 3.2;
      uCurrent = 0.18;
      vCurrent = -0.14;
      uWind = -4.5;
      vWind = 7.4;
    } else if (isEquatorial) {
      // Equatorial Warm Pool & Wyrtki Jet
      sst = 29.9 + Math.sin(lon * 0.2) * 0.35;
      sss = 34.8;
      sla = 12.8;
      uCurrent = 0.42; // Strong eastward equatorial current
      vCurrent = 0.04;
      uWind = -1.5;
      vWind = 2.8;
    }

    const hash = Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453;
    const microNoise = (hash - Math.floor(hash)) * 0.3 - 0.15;

    return {
      sst: Math.round((sst + microNoise) * 10) / 10,
      sss: Math.round((sss + microNoise * 0.4) * 10) / 10,
      sla: Math.round((sla + microNoise * 2.0) * 10) / 10,
      uCurrent: Math.round((uCurrent + microNoise * 0.1) * 100) / 100,
      vCurrent: Math.round((vCurrent + microNoise * 0.1) * 100) / 100,
      uWind: Math.round((uWind + microNoise * 0.5) * 10) / 10,
      vWind: Math.round((vWind + microNoise * 0.5) * 10) / 10,
    };
  }

  public async runOceanEmbedInference(lat: number, lon: number, date?: string): Promise<SubsurfacePrediction> {
    const surface = await this.getSurfaceVariables(lat, lon, date);
    const location = this.resolveCoordinate(lat, lon);

    const isBayOfBengal = location.subRegion === 'Bay of Bengal' || location.subRegion === 'Andaman Sea';
    const isArabianSea = location.subRegion === 'Arabian Sea' || location.subRegion === 'Lakshadweep Sea';
    const isSomali = location.subRegion === 'Somali Basin';

    let thermoclineCenter = 120;
    let thermoclineSharpness = 0.022;
    let deepWaterTemp = 5.8;
    let deepSalinity = 34.7;

    if (isBayOfBengal) {
      thermoclineCenter = 75; // Shallow thermocline due to river stratification
      thermoclineSharpness = 0.035;
      deepWaterTemp = 6.2;
    } else if (isSomali) {
      thermoclineCenter = 42; // Upwelling shoaling
      thermoclineSharpness = 0.042;
      deepWaterTemp = 5.4;
    } else if (isArabianSea) {
      thermoclineCenter = 135; // Deeper winter mixed layer
      thermoclineSharpness = 0.020;
      deepWaterTemp = 5.9;
    }

    const temperatures: number[] = [];
    const uncertainties: number[] = [];
    const epistemicUncertainties: number[] = [];
    const aleatoricUncertainties: number[] = [];
    const salinities: number[] = [];
    const soundSpeeds: number[] = [];
    const densityProfile: number[] = [];

    STANDARD_DEPTH_LEVELS.forEach((depth) => {
      // 1. Thermal Profile
      const logistic = 1 / (1 + Math.exp(thermoclineSharpness * (depth - thermoclineCenter)));
      const tZ = deepWaterTemp + (surface.sst - deepWaterTemp) * logistic;

      // 2. Salinity Profile (halocline transition to deep oceanic 34.7 PSU)
      const sLogistic = 1 / (1 + Math.exp(0.025 * (depth - (thermoclineCenter + 20))));
      const sZ = deepSalinity + (surface.sss - deepSalinity) * sLogistic;

      // 3. Uncertainty Decomposition
      // Epistemic (model uncertainty): grows with depth as surface satellite proxy correlation decays
      const epistemic = 0.12 + (depth / 1000) * 0.85;
      // Aleatoric (data noise / internal wave gradient variance): peaks in the sharp thermocline
      const thermoclineGradFactor = Math.exp(-Math.pow((depth - thermoclineCenter) / 35, 2)) * 0.45;
      const aleatoric = 0.08 + thermoclineGradFactor;
      const totalSigma = Math.sqrt(Math.pow(epistemic, 2) + Math.pow(aleatoric, 2));

      // 4. Seawater Density & Sound Speed (TEOS-10 & Mackenzie)
      const rho = calculateSeawaterDensity(tZ, sZ, depth);
      const c = calculateSoundSpeed(tZ, sZ, depth);

      temperatures.push(Math.round(tZ * 10) / 10);
      uncertainties.push(Math.round(totalSigma * 100) / 100);
      epistemicUncertainties.push(Math.round(epistemic * 100) / 100);
      aleatoricUncertainties.push(Math.round(aleatoric * 100) / 100);
      salinities.push(Math.round(sZ * 100) / 100);
      soundSpeeds.push(Math.round(c * 10) / 10);
      densityProfile.push(Math.round((rho - 1000) * 100) / 100); // Sigma-theta
    });

    // 5. Brunt-Väisälä Buoyancy Frequency Profile
    const { n2: bruntVaisalaN2 } = calculateBruntVaisala(STANDARD_DEPTH_LEVELS, temperatures, salinities);

    // 6. Diagnostics
    const mld = calculateMLD(STANDARD_DEPTH_LEVELS, temperatures);
    const ild = calculateILD(STANDARD_DEPTH_LEVELS, temperatures);
    const blt = calculateBLT(mld, ild);
    const d20 = calculateD20(STANDARD_DEPTH_LEVELS, temperatures);
    const d26 = calculateD26(STANDARD_DEPTH_LEVELS, temperatures);
    const tchp = calculateTCHP(STANDARD_DEPTH_LEVELS, temperatures);
    const uohc300 = calculateOHC(STANDARD_DEPTH_LEVELS, temperatures, 300);
    const { gradient: gradientMax, depth: gradientMaxDepth } = calculateMaxGradient(STANDARD_DEPTH_LEVELS, temperatures);

    const embedding256D = this.generate256DEmbedding(lat, lon, surface);
    const argoProfile = this.findClosestArgoFloat(lat, lon, temperatures, salinities);

    return {
      location,
      timestamp: date || '2026-05-15T12:00:00Z',
      depths: STANDARD_DEPTH_LEVELS,
      temperatures,
      uncertainties,
      epistemicUncertainty: epistemicUncertainties,
      aleatoricUncertainty: aleatoricUncertainties,
      salinities,
      soundSpeeds,
      densityProfile,
      bruntVaisalaN2,
      mld,
      ild,
      blt,
      d20,
      d26,
      tchp,
      uohc300,
      gradientMax,
      gradientMaxDepth,
      embedding256D,
      argoProfile,
      provenance: {
        source: 'demo_curated_grid',
        isIllustrative: true,
        spatialResolution: '0.25° (~27 km)',
        modelChecksum: 'oe-transformer-v1.4-nio',
        gridResolutionKm: 27.8
      }
    };
  }

  public async getSpatialGrid(depth: DepthLevel, _date?: string): Promise<SpatialGridCell[]> {
    const grid: SpatialGridCell[] = [];
    const minLat = 5;
    const maxLat = 25;
    const minLon = 55;
    const maxLon = 95;
    const step = 0.5; // High resolution 0.5° grid for seamless canvas rendering

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
        platformType: 'PROVOR III APEX CTD',
        sensorModel: 'Sea-Bird SBE 41CP',
        cycleNumber: 142,
        timestamp: '2026-05-14T08:30:00Z',
        lat: 14.5,
        lon: 88.2,
        deltaHours: 3.8,
        depths: STANDARD_DEPTH_LEVELS,
        temperatures: [29.8, 29.7, 29.5, 29.1, 27.4, 22.8, 18.2, 15.6, 13.2, 11.4, 10.1, 8.4, 7.2, 6.1, 5.8],
        salinities: [33.2, 33.3, 33.5, 34.1, 34.6, 34.9, 35.0, 35.0, 34.9, 34.8, 34.8, 34.7, 34.7, 34.7, 34.7],
        qualityFlag: 'Passed-QC',
        institution: 'INCOIS / Argo India'
      },
      {
        wmoId: '2902890',
        platformType: 'SOLO-II CTD Float',
        sensorModel: 'Sea-Bird SBE 41CP',
        cycleNumber: 88,
        timestamp: '2026-05-15T02:15:00Z',
        lat: 16.0,
        lon: 66.5,
        deltaHours: 1.5,
        depths: STANDARD_DEPTH_LEVELS,
        temperatures: [28.6, 28.5, 28.4, 28.1, 27.8, 26.2, 23.4, 19.8, 15.2, 13.0, 11.5, 9.6, 8.1, 6.8, 5.9],
        salinities: [36.5, 36.5, 36.4, 36.3, 36.1, 35.8, 35.4, 35.2, 35.0, 34.9, 34.8, 34.7, 34.7, 34.7, 34.7],
        qualityFlag: 'Realtime-A',
        institution: 'INCOIS / Argo India'
      },
      {
        wmoId: '2903102',
        platformType: 'NAVIS-EBR CTD',
        sensorModel: 'Sea-Bird SBE 41CP-N',
        cycleNumber: 215,
        timestamp: '2026-05-13T18:45:00Z',
        lat: 5.5,
        lon: 76.0,
        deltaHours: 6.2,
        depths: STANDARD_DEPTH_LEVELS,
        temperatures: [30.2, 30.1, 30.0, 29.6, 28.9, 25.1, 20.8, 17.5, 14.1, 12.2, 10.8, 8.9, 7.6, 6.4, 5.7],
        salinities: [34.8, 34.8, 34.9, 35.0, 35.1, 35.2, 35.1, 35.0, 34.9, 34.8, 34.8, 34.7, 34.7, 34.7, 34.7],
        qualityFlag: 'Passed-QC',
        institution: 'JAMSTEC / Argo Japan'
      },
      {
        wmoId: '6903211',
        platformType: 'ARVOR-Iridium CTD',
        sensorModel: 'Sea-Bird SBE 41CP',
        cycleNumber: 104,
        timestamp: '2026-05-15T10:00:00Z',
        lat: 10.8,
        lon: 72.4,
        deltaHours: 2.1,
        depths: STANDARD_DEPTH_LEVELS,
        temperatures: [29.1, 29.0, 28.8, 28.4, 27.1, 23.9, 19.1, 16.2, 13.8, 11.9, 10.4, 8.8, 7.5, 6.3, 5.8],
        salinities: [35.8, 35.8, 35.8, 35.7, 35.5, 35.2, 35.0, 34.9, 34.8, 34.8, 34.7, 34.7, 34.7, 34.7, 34.7],
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
      upperLayerRmse: 0.84,
      deepLayerRmse: 0.46,
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
        densityMean: 24.2,
        description: 'Formed by high evaporative flux in the northern Arabian Sea. High salinity core subducted into the central NIO thermocline.',
        physicalOrigin: 'Northern Arabian Basin (20°N–24°N) winter convective mixing and intense excess evaporation over precipitation.',
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
        densityMean: 20.8,
        description: 'Dominated by freshwater runoff from the Ganga-Brahmaputra system. Forms a buoyant barrier layer that inhibits turbulent mixing.',
        physicalOrigin: 'Northern Bay of Bengal (Sundarbans Delta) receiving >1.6×10¹² m³/yr of monsoonal river discharge.',
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
        densityMean: 21.6,
        description: 'Characterized by high sea surface temperature (>29.5°C), positive sea level anomalies, and strong zonal Wyrtki Jets.',
        physicalOrigin: 'Equatorial belt (5°S–5°N) driven by semi-annual equatorial Kelvin wave propagation and high insolation.',
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
        densityMean: 25.1,
        description: 'Southwest monsoon Findlater Jet driven intense coastal upwelling bringing cold, nutrient-dense subsurface water into the euphotic zone.',
        physicalOrigin: 'Western boundary current off the Horn of Africa (Socotra Gyre / Great Whirl) with offshore Ekman transport.',
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
        { variable: 'SST (Sea Surface Temperature)', weight: 0.32, description: 'Mixed layer thermal boundary condition' },
        { variable: 'SLA (Sea Level Anomaly / SSH)', weight: 0.28, description: 'Baroclinic proxy for dynamic thermocline vertical displacement' },
        { variable: 'SSS (Sea Surface Salinity)', weight: 0.18, description: 'Drives haline density stratification & barrier layer thickness' },
        { variable: 'Winds (U/V Wind Stress)', weight: 0.12, description: 'Drives Ekman suction, thermocline pumping & mixing' },
        { variable: 'Currents (U/V Geostrophic)', weight: 0.10, description: 'Horizontal advective heat flux across regional basin boundaries' }
      ],
      depthQueryAttention: [
        { depth: 0, surfaceAttention: { sst: 0.72, sss: 0.12, sla: 0.08, currents: 0.04, winds: 0.04 } },
        { depth: 50, surfaceAttention: { sst: 0.44, sss: 0.22, sla: 0.20, currents: 0.08, winds: 0.06 } },
        { depth: 100, surfaceAttention: { sst: 0.22, sss: 0.18, sla: 0.38, currents: 0.12, winds: 0.10 } },
        { depth: 150, surfaceAttention: { sst: 0.14, sss: 0.14, sla: 0.42, currents: 0.16, winds: 0.14 } },
        { depth: 300, surfaceAttention: { sst: 0.08, sss: 0.10, sla: 0.48, currents: 0.18, winds: 0.16 } },
        { depth: 500, surfaceAttention: { sst: 0.05, sss: 0.08, sla: 0.52, currents: 0.20, winds: 0.15 } },
        { depth: 1000, surfaceAttention: { sst: 0.03, sss: 0.06, sla: 0.55, currents: 0.22, winds: 0.14 } }
      ],
      attentionHeadActivations: [
        { headIndex: 1, name: 'Head 1 (Baroclinic SLA)', specialization: 'Isotherm Displacement', dominantFeature: 'Sea Level Anomaly' },
        { headIndex: 2, name: 'Head 2 (Thermal Boundary)', specialization: 'Surface Heat Inversion', dominantFeature: 'OSTIA SST' },
        { headIndex: 3, name: 'Head 3 (Haline Stratification)', specialization: 'Barrier Layer & Salinity Cap', dominantFeature: 'SMOS SSS' },
        { headIndex: 4, name: 'Head 4 (Ekman Dynamics)', specialization: 'Wind Stress Curl & Upwelling', dominantFeature: 'CCMP Winds' },
        { headIndex: 5, name: 'Head 5 (Eddy Advection)', specialization: 'Mesoscale Rings & Currents', dominantFeature: 'OSCAR Velocity' },
        { headIndex: 6, name: 'Head 6 (Monsoon Memory)', specialization: '31-Day Temporal Evolution', dominantFeature: 'Temporal Conv3D' },
        { headIndex: 7, name: 'Head 7 (Deep Abyssal Decoupling)', specialization: 'Climatological Regularization', dominantFeature: 'Depth Query' },
        { headIndex: 8, name: 'Head 8 (Uncertainty Estimation)', specialization: 'Heteroscedastic Epistemic Head', dominantFeature: 'Latent Variance' }
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
          { lat: 12.1, lon: 66.0, date: '2023-06-06', intensityKt: 45, category: 'CS', centralPressureHpa: 994, tchp: 88.5, sst: 30.6 },
          { lat: 14.2, lon: 66.2, date: '2023-06-08', intensityKt: 75, category: 'VSCS', centralPressureHpa: 978, tchp: 94.2, sst: 30.4 },
          { lat: 17.5, lon: 67.4, date: '2023-06-11', intensityKt: 90, category: 'ESCS', centralPressureHpa: 954, tchp: 102.0, sst: 30.2 },
          { lat: 21.0, lon: 68.1, date: '2023-06-14', intensityKt: 70, category: 'VSCS', centralPressureHpa: 972, tchp: 54.1, sst: 28.2 }
        ],
        preStormThermalProfile: {
          depths: STANDARD_DEPTH_LEVELS,
          temperatures: [30.4, 30.2, 30.1, 29.8, 29.1, 26.5, 22.1, 18.4, 15.1, 13.2, 11.6, 9.4, 8.0, 6.7, 5.8],
          salinities: [36.4, 36.4, 36.3, 36.2, 36.0, 35.6, 35.3, 35.1, 35.0, 34.9, 34.8, 34.7, 34.7, 34.7, 34.7]
        },
        postStormThermalProfile: {
          depths: STANDARD_DEPTH_LEVELS,
          temperatures: [27.2, 27.1, 27.0, 26.9, 26.4, 25.2, 21.4, 18.1, 14.9, 13.1, 11.5, 9.3, 7.9, 6.6, 5.8],
          salinities: [36.2, 36.2, 36.1, 36.0, 35.8, 35.5, 35.2, 35.1, 35.0, 34.9, 34.8, 34.7, 34.7, 34.7, 34.7]
        },
        sstCoolingWake: 3.2,
        subsurfaceHeatDepletion: 38.4,
        mixedLayerDeepeningMeters: 42,
        description: 'Prolonged slow translation (3-5 km/h) over the central Arabian Sea caused vigorous shear-induced vertical entrainment, deepening the mixed layer by 42m and leaving a wide cold wake.',
        operationalTakeaway: 'Reconstructing the subsurface heat content proved essential because the pre-existing deep warm layer sustained cyclonic intensity far longer than SST models estimated.'
      },
      {
        id: 'amphan_2020',
        cycloneName: 'Super Cyclonic Storm AMPHAN',
        year: 2020,
        category: 'Super Cyclone (Category 5 equivalent)',
        basin: 'Bay of Bengal',
        trackPoints: [
          { lat: 11.0, lon: 86.5, date: '2020-05-16', intensityKt: 55, category: 'CS', centralPressureHpa: 990, tchp: 112.4, sst: 31.4 },
          { lat: 13.5, lon: 86.4, date: '2020-05-17', intensityKt: 110, category: 'ESCS', centralPressureHpa: 940, tchp: 124.0, sst: 31.2 },
          { lat: 16.5, lon: 86.8, date: '2020-05-18', intensityKt: 140, category: 'Super Cyclone', centralPressureHpa: 906, tchp: 118.6, sst: 30.8 },
          { lat: 21.6, lon: 88.3, date: '2020-05-20', intensityKt: 85, category: 'VSCS', centralPressureHpa: 950, tchp: 62.0, sst: 29.0 }
        ],
        preStormThermalProfile: {
          depths: STANDARD_DEPTH_LEVELS,
          temperatures: [31.2, 31.0, 30.8, 30.2, 28.9, 24.2, 19.4, 16.1, 13.8, 12.0, 10.5, 8.7, 7.4, 6.2, 5.7],
          salinities: [33.0, 33.1, 33.4, 34.0, 34.5, 34.8, 35.0, 35.0, 34.9, 34.8, 34.8, 34.7, 34.7, 34.7, 34.7]
        },
        postStormThermalProfile: {
          depths: STANDARD_DEPTH_LEVELS,
          temperatures: [28.4, 28.3, 28.1, 27.8, 27.2, 23.5, 19.0, 15.8, 13.6, 11.9, 10.4, 8.6, 7.3, 6.2, 5.7],
          salinities: [33.8, 33.8, 34.0, 34.3, 34.6, 34.9, 35.0, 35.0, 34.9, 34.8, 34.8, 34.7, 34.7, 34.7, 34.7]
        },
        sstCoolingWake: 2.8,
        subsurfaceHeatDepletion: 46.2,
        mixedLayerDeepeningMeters: 36,
        description: 'Unprecedented pre-monsoon Tropical Cyclone Heat Potential (>120 kJ/cm²) coupled with a prominent barrier layer in the central Bay of Bengal led to catastrophic rapid intensification in under 24 hours.',
        operationalTakeaway: 'High TCHP with shallow salinity barrier layers prevents negative thermal feedback, enabling storms to reach Category 5 intensity.'
      }
    ];
  }

  public async getUpwellingZones(): Promise<UpwellingZone[]> {
    return [
      {
        id: 'upw_kerala',
        name: 'Southwest Coast Upwelling System (Kerala / Malabar)',
        lat: 9.5,
        lon: 75.8,
        verticalGradient: 5.2,
        thermoclineDepth: 22,
        pfzStatus: 'High Activity',
        chlorophyllProxy: '4.8 mg/m³ (High Bloom)',
        summary: 'Equatorward West India Coastal Current and wind-driven offshore Ekman transport uplift the cold, nutrient-rich 20°C isotherm to 22m, fueling primary productivity.',
        economicFishSpecies: ['Indian Mackerel (Rastrelliger kanagurta)', 'Oil Sardine (Sardinella longiceps)', 'Anchovies']
      },
      {
        id: 'upw_oman',
        name: 'Oman / Ras al Hadd Findlater Upwelling Jet',
        lat: 19.2,
        lon: 58.4,
        verticalGradient: 6.4,
        thermoclineDepth: 18,
        pfzStatus: 'High Activity',
        chlorophyllProxy: '6.2 mg/m³ (Intense Bloom)',
        summary: 'Intense low-level atmospheric jet drives coastal divergence with sharp sea-surface temperature fronts exceeding 4°C per 10 km.',
        economicFishSpecies: ['Yellowfin Tuna (Thunnus albacares)', 'Kingfish', 'Cutlassfish']
      },
      {
        id: 'upw_tamilnadu',
        name: 'Coromandel Coast / Gulf of Mannar Upwelling',
        lat: 9.0,
        lon: 79.2,
        verticalGradient: 3.8,
        thermoclineDepth: 36,
        pfzStatus: 'Moderate',
        chlorophyllProxy: '2.6 mg/m³',
        summary: 'Seasonal divergence through the Palk Strait and Gulf of Mannar providing critical nursery grounds for demersal fish stocks.',
        economicFishSpecies: ['Snappers', 'Groupers', 'Squid / Cuttlefish']
      }
    ];
  }

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
    const seed = lat * 17.1 + lon * 31.3 + surface.sst * 7.7 + surface.sss * 13.2;
    for (let i = 0; i < 256; i++) {
      const v = Math.sin(seed + i * 0.18) * Math.cos((i * 0.31) + lat * 0.1);
      vector.push(Math.round(v * 1000) / 1000);
    }
    return vector;
  }

  private findClosestArgoFloat(lat: number, lon: number, predictedTemps: number[], predictedSalinities: number[]): ArgoFloatObservation | undefined {
    const floats = [
      { wmoId: '2902748', lat: 14.5, lon: 88.2, cycle: 142, deltaH: 3.8, platform: 'PROVOR III APEX CTD', sensor: 'Sea-Bird SBE 41CP', inst: 'INCOIS / Argo India' },
      { wmoId: '2902890', lat: 16.0, lon: 66.5, cycle: 88, deltaH: 1.5, platform: 'SOLO-II CTD Float', sensor: 'Sea-Bird SBE 41CP', inst: 'INCOIS / Argo India' },
      { wmoId: '2903102', lat: 5.5, lon: 76.0, cycle: 215, deltaH: 6.2, platform: 'NAVIS-EBR CTD', sensor: 'Sea-Bird SBE 41CP-N', inst: 'JAMSTEC / Argo Japan' },
      { wmoId: '6903211', lat: 10.8, lon: 72.4, cycle: 104, deltaH: 2.1, platform: 'ARVOR-Iridium CTD', sensor: 'Sea-Bird SBE 41CP', inst: 'INCOIS / NIO Goa' }
    ];

    for (const f of floats) {
      const dist = Math.sqrt(Math.pow(lat - f.lat, 2) + Math.pow(lon - f.lon, 2));
      if (dist < 2.0) {
        const argoTemps = predictedTemps.map((t, idx) => {
          const depth = STANDARD_DEPTH_LEVELS[idx];
          const sensorDelta = (Math.sin(depth * 0.05 + f.cycle) * 0.35) + (depth === 100 ? 0.32 : 0.04);
          return Math.round((t + sensorDelta) * 10) / 10;
        });

        const argoSal = predictedSalinities.map((s) => {
          return Math.round((s + (Math.random() * 0.04 - 0.02)) * 100) / 100;
        });

        return {
          wmoId: f.wmoId,
          platformType: f.platform,
          sensorModel: f.sensor,
          cycleNumber: f.cycle,
          timestamp: '2026-05-15T06:00:00Z',
          lat: f.lat,
          lon: f.lon,
          deltaHours: f.deltaH,
          depths: STANDARD_DEPTH_LEVELS,
          temperatures: argoTemps,
          salinities: argoSal,
          qualityFlag: 'Passed-QC',
          institution: f.inst
        };
      }
    }
    return undefined;
  }

  private checkIfLand(lat: number, lon: number): boolean {
    if (lat >= 8.0 && lat <= 26.0) {
      if (lat >= 8.0 && lat <= 13.0 && lon >= 75.2 && lon <= 80.2) return true;
      if (lat > 13.0 && lat <= 18.0 && lon >= 73.2 && lon <= 84.0) return true;
      if (lat > 18.0 && lat <= 23.5 && lon >= 69.5 && lon <= 88.5) return true;
      if (lat > 23.5 && lon >= 68.0 && lon <= 92.0) return true;
    }
    if (lat >= 5.8 && lat <= 9.8 && lon >= 79.5 && lon <= 82.0) return true;
    if (lat >= 12.0 && lon <= 58.5) return true;
    if (lat >= 22.0 && lon <= 68.0) return true;
    if (lat >= 10.0 && lon >= 94.5) return true;
    if (lat >= 16.0 && lon >= 93.8) return true;

    return false;
  }

  private estimateBathymetry(lat: number, lon: number): number {
    if (lat <= 8.0) return 4200;
    if (lon < 75.0) return 3800;
    if (lon > 82.0) return 3200;
    return 2400;
  }
}
