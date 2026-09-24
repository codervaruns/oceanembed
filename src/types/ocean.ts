// OceanEmbed TypeScript Types & Scientific Oceanographic Data Contracts
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

export type DepthLevel = 0 | 10 | 25 | 50 | 75 | 100 | 125 | 150 | 200 | 250 | 300 | 400 | 500 | 750 | 1000;

export const STANDARD_DEPTH_LEVELS: DepthLevel[] = [
  0, 10, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000
];

export interface OceanCoordinate {
  lat: number;
  lon: number;
  regionName: string;
  subRegion: 'Arabian Sea' | 'Bay of Bengal' | 'Equatorial Indian Ocean' | 'Somali Basin' | 'Lakshadweep Sea' | 'Andaman Sea';
  bathymetryDepth: number; // in meters
}

export interface SurfaceVariableMetadata {
  id: 'sst' | 'sss' | 'sla' | 'u_curr' | 'v_curr' | 'u_wind' | 'v_wind';
  name: string;
  symbol: string;
  unit: string;
  description: string;
  satelliteSource: string;
  physicalRole: string;
  color: string;
  validRange: [number, number];
}

export interface SurfaceVariables {
  sst: number;      // Sea Surface Temperature (°C)
  sss: number;      // Sea Surface Salinity (PSU)
  sla: number;      // Sea Level Anomaly (cm)
  uCurrent: number; // Zonal Surface Current (m/s)
  vCurrent: number; // Meridional Surface Current (m/s)
  uWind: number;    // Zonal Wind (m/s)
  vWind: number;    // Meridional Wind (m/s)
}

export interface ArgoFloatObservation {
  wmoId: string;
  platformType: string;
  cycleNumber: number;
  timestamp: string;
  lat: number;
  lon: number;
  deltaHours: number; // Co-location time gap (hours)
  depths: number[];
  temperatures: number[];
  salinities: number[];
  qualityFlag: 'Realtime-A' | 'Delayed-Mode' | 'Passed-QC';
  institution: string;
  sensorModel: string;
}

export interface SubsurfacePrediction {
  location: OceanCoordinate;
  timestamp: string;
  depths: DepthLevel[];
  temperatures: number[];       // Predicted temperatures in °C (15 points)
  uncertainties: number[];      // Total ±1σ uncertainty in °C (15 points)
  epistemicUncertainty: number[]; // Model/weight variance in °C
  aleatoricUncertainty: number[]; // Inherent observation noise in °C
  salinities: number[];         // Reconstructed/climatological salinity profile (PSU)
  soundSpeeds: number[];        // Underwater sound speed profile c(z) (m/s)
  densityProfile: number[];     // Potential density profile sigma_theta (kg/m³)
  bruntVaisalaN2: number[];     // Buoyancy frequency squared N²(z) (rad²/s²)
  
  // Oceanographic Stratification & Disaster Diagnostics
  mld: number;                  // Mixed Layer Depth (m) where T(0) - T(z) >= 0.2°C
  ild: number;                  // Isothermal Layer Depth (m) where T(0) - T(z) >= 0.5°C
  blt: number;                  // Barrier Layer Thickness (m) = ILD - MLD
  d20: number;                  // 20°C Isotherm Depth (m) - thermocline proxy
  d26: number;                  // 26°C Isotherm Depth (m) - cyclone threshold
  tchp: number;                 // Tropical Cyclone Heat Potential (kJ/cm²)
  uohc300: number;              // Upper Ocean Heat Content (0-300m) in GJ/m²
  gradientMax: number;          // Maximum vertical temperature gradient (°C/m)
  gradientMaxDepth: number;     // Depth of maximum vertical gradient (m)
  
  embedding256D: number[];      // 256-D Latent vector snippet
  argoProfile?: ArgoFloatObservation;
  provenance: {
    source: 'demo_curated_grid' | 'fastapi_oceanembed_model';
    isIllustrative: boolean;
    spatialResolution: string;
    modelChecksum?: string;
    gridResolutionKm: number;
  };
}

export interface WaterMassCluster {
  id: string;
  name: string;
  color: string;
  tsneX: number;
  tsneY: number;
  salinityMean: number;
  tempMean: number;
  densityMean: number;
  description: string;
  physicalOrigin: string;
  samplePoints: { lat: number; lon: number; label: string }[];
}

export interface AttentionMapData {
  variableWeights: {
    variable: string;
    weight: number;
    description: string;
  }[];
  depthQueryAttention: {
    depth: number;
    surfaceAttention: { sst: number; sss: number; sla: number; currents: number; winds: number };
  }[];
  attentionHeadActivations: {
    headIndex: number;
    name: string;
    specialization: string;
    dominantFeature: string;
  }[];
}

export interface ArgoValidationMetrics {
  totalProfiles: number;
  overallRmse: number;
  overallMae: number;
  r2Score: number;
  upperLayerRmse: number; // 0-200m
  deepLayerRmse: number;  // 200-1000m
  regionalRmse: {
    region: string;
    rmse: number;
    profileCount: number;
  }[];
  depthWiseResiduals: {
    depth: DepthLevel;
    meanResidual: number;
    stdResidual: number;
    rmse: number;
  }[];
}

export interface CycloneTrackPoint {
  lat: number;
  lon: number;
  date: string;
  intensityKt: number;
  category: string;
  centralPressureHpa: number;
  tchp: number;
  sst: number;
}

export interface CycloneCaseStudy {
  id: string;
  cycloneName: string;
  year: number;
  category: string;
  basin: string;
  trackPoints: CycloneTrackPoint[];
  preStormThermalProfile: { depths: number[]; temperatures: number[]; salinities: number[] };
  postStormThermalProfile: { depths: number[]; temperatures: number[]; salinities: number[] };
  sstCoolingWake: number; // in °C
  subsurfaceHeatDepletion: number; // in kJ/cm²
  mixedLayerDeepeningMeters: number;
  description: string;
  operationalTakeaway: string;
}

export interface UpwellingZone {
  id: string;
  name: string;
  lat: number;
  lon: number;
  verticalGradient: number; // °C/50m
  thermoclineDepth: number; // in meters
  pfzStatus: 'High Activity' | 'Moderate' | 'Favorable';
  chlorophyllProxy: string;
  summary: string;
  economicFishSpecies: string[];
}

export type ActiveTab = 'map' | 'insights' | 'argo' | 'disaster' | 'provenance';
export type MapLayerMode = 'temperature' | 'uncertainty' | 'argo' | 'currents' | 'winds';
export type ThemeMode = 'dark' | 'light';
export type DataSourceMode = 'demo' | 'fastapi';
export type ProfileCurveMode = 'temperature' | 'brunt_vaisala' | 'sound_speed' | 'density';
