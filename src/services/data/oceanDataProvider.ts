// Ocean Data Provider Singleton & Switcher Factory
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import { IOceanDataProvider } from './IOceanDataProvider';
import { DemoDataProvider } from './demoDataProvider';
import { RealModelProvider } from './realModelProvider';
import { DataSourceMode } from '../../types/ocean';

class OceanDataProviderManager {
  private demoProvider = new DemoDataProvider();
  private realProvider = new RealModelProvider();
  private currentMode: DataSourceMode = 'demo';

  public setMode(mode: DataSourceMode) {
    this.currentMode = mode;
  }

  public getMode(): DataSourceMode {
    return this.currentMode;
  }

  public getProvider(): IOceanDataProvider {
    if (this.currentMode === 'fastapi') {
      return this.realProvider;
    }
    return this.demoProvider;
  }
}

export const oceanDataManager = new OceanDataProviderManager();
export const oceanData = oceanDataManager.getProvider();
