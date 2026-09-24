// OceanDataProvider Interface (Data Abstraction Layer)
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import {
  DepthLevel,
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

export interface SpatialGridCell {
  lat: number;
  lon: number;
  depth: DepthLevel;
  temperature: number;
  uncertainty: number;
  isLand: boolean;
  bathymetry: number;
}

export interface IOceanDataProvider {
  getSurfaceVariables(lat: number, lon: number, date?: string): Promise<SurfaceVariables>;
  runOceanEmbedInference(lat: number, lon: number, date?: string): Promise<SubsurfacePrediction>;
  getSpatialGrid(depth: DepthLevel, date?: string): Promise<SpatialGridCell[]>;
  getArgoBenchmarkProfiles(): Promise<ArgoFloatObservation[]>;
  getArgoValidationMetrics(): Promise<ArgoValidationMetrics>;
  getWaterMassClusters(): Promise<WaterMassCluster[]>;
  getAttentionData(): Promise<AttentionMapData>;
  getDisasterCaseStudies(): Promise<CycloneCaseStudy[]>;
  getUpwellingZones(): Promise<UpwellingZone[]>;
  isLiveModelConnected(): Promise<boolean>;
}
