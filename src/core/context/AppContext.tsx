import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { GameFeature, GameModeDefinition, GameStats, ReplayOptions } from '../../types';
import { CityGameMode } from '../../features/city';
import { RoadGameMode } from '../../features/road';

export const AVAILABLE_MODES = [CityGameMode, RoadGameMode];

type Screen = 'MENU' | 'PLAY' | 'RESULTS';

interface LastGameResult {
  stats: GameStats;
  targets: GameFeature[];
  correct: GameFeature[];
  wrong: GameFeature[];
}

interface AppState {
  screen: Screen;
  setScreen: (s: Screen) => void;

  activeMode: GameModeDefinition<any>;
  setActiveMode: (mode: GameModeDefinition<any>) => void;

  config: any;
  setConfig: (c: any) => void;

  data: GameFeature[];
  isLoading: boolean;

  lastGameResult: LastGameResult | null;
  setLastGameResult: (res: LastGameResult) => void;
  replayOptions: ReplayOptions | null;
  startReplay: () => void;
  clearReplay: () => void;
}

const AppContext = createContext<AppState>({} as AppState);

const normalizeString = (str: string) =>
  str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<Screen>('MENU');
  const [activeMode, setActiveMode] = useState(AVAILABLE_MODES[0]);
  const [config, setConfig] = useState(AVAILABLE_MODES[0].defaultConfig);

  // Data State
  const [cityData, setCityData] = useState<any[]>([]);
  const [roadData, setRoadData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Result & Replay State
  const [lastGameResult, setLastGameResult] = useState<LastGameResult | null>(null);
  const [replayOptions, setReplayOptions] = useState<ReplayOptions | null>(null);

  // Load Data on Mount
  useEffect(() => {
    setIsLoading(true);

    const fetchCities = fetch('/data/cities.json')
      .then(res => res.json())
      .then(geoJson => {
        return geoJson.features.map((f: any) => ({
          id: f.properties.identificatie,
          name: f.properties.name,
          aliases: (f.properties.aliases || []).map(normalizeString),
          population: f.properties.population,
          province: f.properties.province,
          geometry: f.geometry
        }));
      })
      .catch(err => {
        console.error("Failed to load cities:", err);
        return [];
      });

    const fetchRoads = fetch('/data/roads.json')
      .then(res => res.json())
      .then(geoJson => {
        return geoJson.features.map((f: any) => ({
          ...f.properties, // Spread generic properties (id, type, lengthKm, etc.)
          aliases: (f.properties.aliases || []).map(normalizeString),
          geometry: f.geometry
        }));
      })
      .catch(err => {
        console.warn("Failed to load roads (file might not exist yet):", err);
        return [];
      });

    // Wait for both to finish
    Promise.all([fetchCities, fetchRoads]).then(([cities, roads]) => {
      setCityData(cities);
      setRoadData(roads);
      setIsLoading(false);
    });
  }, []);

  const currentData = useMemo(() => {
    switch (activeMode.id) {
      case 'city-quiz':
        return cityData;
      case 'road-quiz':
        return roadData;
      default:
        return [];
    }
  }, [activeMode.id, cityData, roadData]);

  const handleSetMode = (mode: GameModeDefinition<any>) => {
    setActiveMode(mode);
    setConfig(mode.defaultConfig);
    clearReplay();
  };

  const startReplay = () => {
    if (lastGameResult && lastGameResult.wrong.length > 0) {
      setReplayOptions({
        toPlayIds: lastGameResult.wrong.map(f => f.id),
        solvedIds: lastGameResult.correct.map(f => f.id)
      });
      setScreen('PLAY');
    }
  };

  const clearReplay = () => {
    setReplayOptions(null);
  };

  return (
    <AppContext.Provider value={{
      screen,
      setScreen,
      activeMode,
      setActiveMode: handleSetMode,
      config,
      setConfig,
      data: currentData,
      isLoading,
      lastGameResult,
      setLastGameResult,
      replayOptions,
      startReplay,
      clearReplay,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
