// Global Ocean Context & State Management
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ActiveTab,
  DepthLevel,
  STANDARD_DEPTH_LEVELS,
  OceanCoordinate,
  SurfaceVariables,
  SubsurfacePrediction,
  MapLayerMode,
  ThemeMode,
  DataSourceMode
} from '../types/ocean';
import { oceanDataManager } from '../services/data/oceanDataProvider';

interface OceanContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedLocation: OceanCoordinate;
  setSelectedLocation: (lat: number, lon: number) => Promise<void>;
  activeDepth: DepthLevel;
  setActiveDepth: (depth: DepthLevel) => void;
  depthIndex: number;
  mapLayer: MapLayerMode;
  setMapLayer: (layer: MapLayerMode) => void;
  surfaceVariables: SurfaceVariables | null;
  prediction: SubsurfacePrediction | null;
  surfaceToggles: Record<string, boolean>;
  toggleSurfaceVariable: (id: string) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  dataSourceMode: DataSourceMode;
  setDataSourceMode: (mode: DataSourceMode) => void;
  isLiveConnected: boolean;
  isInferenceRunning: boolean;
  isPipelineModalOpen: boolean;
  setIsPipelineModalOpen: (open: boolean) => void;
  triggerInference: () => Promise<void>;
  // Guided Pitch / Presentation Tour State
  isTourActive: boolean;
  tourStep: number;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  exitTour: () => void;
}

const defaultLocation: OceanCoordinate = {
  lat: 14.5,
  lon: 68.2,
  regionName: 'Central Arabian Sea',
  subRegion: 'Arabian Sea',
  bathymetryDepth: 3800
};

const OceanContext = createContext<OceanContextType | undefined>(undefined);

export const OceanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [selectedLocation, setSelectedLocationState] = useState<OceanCoordinate>(defaultLocation);
  const [activeDepth, setActiveDepth] = useState<DepthLevel>(0);
  const [mapLayer, setMapLayer] = useState<MapLayerMode>('temperature');
  const [surfaceVariables, setSurfaceVariables] = useState<SurfaceVariables | null>(null);
  const [prediction, setPrediction] = useState<SubsurfacePrediction | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [dataSourceMode, setDataSourceModeState] = useState<DataSourceMode>('demo');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isInferenceRunning, setIsInferenceRunning] = useState<boolean>(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);

  const [surfaceToggles, setSurfaceToggles] = useState<Record<string, boolean>>({
    sst: true,
    sss: true,
    sla: true,
    u_curr: true,
    v_curr: true,
    u_wind: true,
    v_wind: true,
  });

  // Apply data-theme attribute on document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setDataSourceMode = useCallback((mode: DataSourceMode) => {
    setDataSourceModeState(mode);
    oceanDataManager.setMode(mode);
  }, []);

  // Check backend health periodically
  useEffect(() => {
    const checkLive = async () => {
      const live = await oceanDataManager.getProvider().isLiveModelConnected();
      setIsLiveConnected(live);
    };
    checkLive();
    const timer = setInterval(checkLive, 8000);
    return () => clearInterval(timer);
  }, []);

  // Fetch surface data and subsurface prediction for coordinates
  const loadDataForLocation = useCallback(async (lat: number, lon: number) => {
    const provider = oceanDataManager.getProvider();
    const surface = await provider.getSurfaceVariables(lat, lon);
    setSurfaceVariables(surface);
    const pred = await provider.runOceanEmbedInference(lat, lon);
    setPrediction(pred);
    setSelectedLocationState(pred.location);
  }, []);

  useEffect(() => {
    loadDataForLocation(defaultLocation.lat, defaultLocation.lon);
  }, [loadDataForLocation]);

  const setSelectedLocation = useCallback(async (lat: number, lon: number) => {
    await loadDataForLocation(lat, lon);
  }, [loadDataForLocation]);

  const toggleSurfaceVariable = useCallback((id: string) => {
    setSurfaceToggles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const triggerInference = useCallback(async () => {
    setIsInferenceRunning(true);
    setIsPipelineModalOpen(true);
    // 2.2s neural pipeline animation
    setTimeout(async () => {
      await loadDataForLocation(selectedLocation.lat, selectedLocation.lon);
      setIsInferenceRunning(false);
    }, 2200);
  }, [selectedLocation, loadDataForLocation]);

  // Guided Tour handlers
  const startTour = useCallback(() => {
    setIsTourActive(true);
    setTourStep(0);
    setActiveTab('map');
  }, []);

  const nextTourStep = useCallback(() => {
    setTourStep(prev => {
      const next = prev + 1;
      if (next > 8) {
        setIsTourActive(false);
        return 0;
      }
      return next;
    });
  }, []);

  const prevTourStep = useCallback(() => {
    setTourStep(prev => Math.max(0, prev - 1));
  }, []);

  const exitTour = useCallback(() => {
    setIsTourActive(false);
    setTourStep(0);
  }, []);

  const depthIndex = STANDARD_DEPTH_LEVELS.indexOf(activeDepth);

  return (
    <OceanContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedLocation,
        setSelectedLocation,
        activeDepth,
        setActiveDepth,
        depthIndex,
        mapLayer,
        setMapLayer,
        surfaceVariables,
        prediction,
        surfaceToggles,
        toggleSurfaceVariable,
        theme,
        toggleTheme,
        dataSourceMode,
        setDataSourceMode,
        isLiveConnected,
        isInferenceRunning,
        isPipelineModalOpen,
        setIsPipelineModalOpen,
        triggerInference,
        isTourActive,
        tourStep,
        startTour,
        nextTourStep,
        prevTourStep,
        exitTour
      }}
    >
      {children}
    </OceanContext.Provider>
  );
};

export const useOcean = (): OceanContextType => {
  const context = useContext(OceanContext);
  if (!context) {
    throw new Error('useOcean must be used within an OceanProvider');
  }
  return context;
};
