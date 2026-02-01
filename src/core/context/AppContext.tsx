import React, { createContext, useContext, useState, useEffect } from 'react';
import type { GameModeAdapter, ReplayOptions, Question } from '../types';
import { CityAdapter } from '../../features/city/CityAdapter';
import { RoadAdapter } from '../../features/road/RoadAdapter';
import { normalizeString } from '../../utils';

export const AVAILABLE_ADAPTERS = [CityAdapter, RoadAdapter];

interface LastGameResult {
  stats: any;
  history: { correct: Question<any>[], wrong: Question<any>[] };
}

interface AppState {
  screen: 'MENU' | 'PLAY' | 'RESULTS' | 'PROGRESS';
  setScreen: (s: 'MENU' | 'PLAY' | 'RESULTS' | 'PROGRESS') => void;

  activeAdapter: GameModeAdapter<any, any>;
  setActiveAdapter: (adapter: GameModeAdapter<any, any>) => void;

  config: any;
  setConfig: (c: any) => void;

  data: { cities: any[], roads: any[] };
  isLoading: boolean;

  lastGameResult: LastGameResult | null;
  setLastGameResult: (res: LastGameResult) => void;

  replayOptions: ReplayOptions | null;
  startReplay: () => void;
  clearReplay: () => void;
  startNewGame: () => void;
}

const AppContext = createContext<AppState>({} as AppState);

const LAST_ADAPTER_KEY = 'nl_quiz_last_adapter';

const loadLastAdapter = () => {
  try {
    const savedId = localStorage.getItem(LAST_ADAPTER_KEY);
    if (!savedId) return AVAILABLE_ADAPTERS[0];
    return AVAILABLE_ADAPTERS.find((adapter) => adapter.id === savedId) || AVAILABLE_ADAPTERS[0];
  } catch {
    return AVAILABLE_ADAPTERS[0];
  }
};

const loadConfigForAdapter = (adapter: GameModeAdapter<any, any>) => {
  const key = `nl_quiz_config_${adapter.id}`;
  const savedString = localStorage.getItem(key);

  if (!savedString) return adapter.defaultConfig;

  try {
    const saved = JSON.parse(savedString);
    const merged = { ...adapter.defaultConfig, ...saved };

    if (adapter.defaultConfig.learningOptions) {
      merged.learningOptions = {
        ...adapter.defaultConfig.learningOptions,
        ...(saved.learningOptions || {})
      };
    }

    return merged;
  } catch (e) {
    console.error("Failed to parse saved config, resetting to default", e);
    return adapter.defaultConfig;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialAdapter = loadLastAdapter();
  const [screen, setScreen] = useState<'MENU' | 'PLAY' | 'RESULTS' | 'PROGRESS'>('MENU');
  const [activeAdapter, setActiveAdapter] = useState(initialAdapter);
  const [config, setConfig] = useState(() => loadConfigForAdapter(initialAdapter));

  const [cityData, setCityData] = useState<any[]>([]);
  const [roadData, setRoadData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [lastGameResult, setLastGameResult] = useState<LastGameResult | null>(null);
  const [replayOptions, setReplayOptions] = useState<ReplayOptions | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const baseUrl = import.meta.env.BASE_URL || '/';
    Promise.all([
      fetch(`${baseUrl}data/cities.json`).then(r => r.json()).catch(() => ({ features: [] })),
      fetch(`${baseUrl}data/roads.json`).then(r => r.json()).catch(() => ({ features: [] }))
    ]).then(([cityJson, roadJson]) => {
      const cities = cityJson.features.map((f: any) => ({
        ...f.properties,
        id: f.properties.identificatie,
        aliases: (f.properties.aliases || []).map(normalizeString),
        geometry: f.geometry
      }));

      const roads = roadJson.features.map((f: any) => ({
        ...f.properties,
        aliases: (f.properties.aliases || []).map(normalizeString),
        geometry: f.geometry
      }));

      setCityData(cities);
      setRoadData(roads);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const key = `nl_quiz_config_${activeAdapter.id}`;
    localStorage.setItem(key, JSON.stringify(config));
  }, [config, activeAdapter.id]);

  useEffect(() => {
    localStorage.setItem(LAST_ADAPTER_KEY, activeAdapter.id);
  }, [activeAdapter.id]);

  const handleSetAdapter = (adapter: GameModeAdapter<any, any>) => {
    setActiveAdapter(adapter);
    setConfig(loadConfigForAdapter(adapter));
    clearReplay();
  };

  const startNewGame = () => {
    clearReplay();
    setScreen('PLAY');
  }

  const startReplay = () => {
    if (lastGameResult && lastGameResult.history.wrong.length > 0) {
      setReplayOptions({
        toPlayIds: lastGameResult.history.wrong.map(q => q.payload.id),
        solvedIds: lastGameResult.history.correct.map(q => q.payload.id)
      });
      setScreen('PLAY');
    }
  };

  const clearReplay = () => setReplayOptions(null);

  return (
    <AppContext.Provider value={{
      screen, setScreen,
      activeAdapter, setActiveAdapter: handleSetAdapter,
      config, setConfig,
      data: { cities: cityData, roads: roadData },
      isLoading,
      lastGameResult, setLastGameResult,
      replayOptions, startReplay, clearReplay, startNewGame
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
