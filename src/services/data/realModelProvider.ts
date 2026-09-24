// Real FastAPI ML Model Data Provider
// Connects to the OceanEmbed Python/PyTorch inference service
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import {
  DepthLevel,
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
import { DemoDataProvider } from './demoDataProvider';

export class RealModelProvider implements IOceanDataProvider {
  private fallbackProvider = new DemoDataProvider();
  private baseUrl = 'http://localhost:8000/api';

  public async isLiveModelConnected(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/model/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(1200)
      });
      if (res.ok) {
        const json = await res.json();
        return json.status === 'ready' || json.status === 'healthy';
      }
      return false;
    } catch {
      return false;
    }
  }

  public async getSurfaceVariables(lat: number, lon: number, date?: string): Promise<SurfaceVariables> {
    try {
      const res = await fetch(`${this.baseUrl}/ocean/inputs?lat=${lat}&lon=${lon}&date=${date || ''}`, {
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return this.fallbackProvider.getSurfaceVariables(lat, lon, date);
  }

  public async runOceanEmbedInference(lat: number, lon: number, date?: string): Promise<SubsurfacePrediction> {
    try {
      const res = await fetch(`${this.baseUrl}/model/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lon, date: date || new Date().toISOString() }),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        return {
          ...data,
          provenance: {
            source: 'fastapi_oceanembed_model',
            isIllustrative: false,
            spatialResolution: '0.25° (~27 km)',
            modelChecksum: data.checksum || 'oe-transformer-live-v1'
          }
        };
      }
    } catch {
      // Fallback
    }
    return this.fallbackProvider.runOceanEmbedInference(lat, lon, date);
  }

  public async getSpatialGrid(depth: DepthLevel, date?: string): Promise<SpatialGridCell[]> {
    try {
      const res = await fetch(`${this.baseUrl}/ocean/map?depth=${depth}&date=${date || ''}`, {
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return this.fallbackProvider.getSpatialGrid(depth, date);
  }

  public async getArgoBenchmarkProfiles(): Promise<ArgoFloatObservation[]> {
    try {
      const res = await fetch(`${this.baseUrl}/ocean/argo`, {
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return this.fallbackProvider.getArgoBenchmarkProfiles();
  }

  public async getArgoValidationMetrics(): Promise<ArgoValidationMetrics> {
    try {
      const res = await fetch(`${this.baseUrl}/ocean/argo/metrics`, {
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return this.fallbackProvider.getArgoValidationMetrics();
  }

  public async getWaterMassClusters(): Promise<WaterMassCluster[]> {
    return this.fallbackProvider.getWaterMassClusters();
  }

  public async getAttentionData(): Promise<AttentionMapData> {
    return this.fallbackProvider.getAttentionData();
  }

  public async getDisasterCaseStudies(): Promise<CycloneCaseStudy[]> {
    return this.fallbackProvider.getDisasterCaseStudies();
  }

  public async getUpwellingZones(): Promise<UpwellingZone[]> {
    return this.fallbackProvider.getUpwellingZones();
  }
}
