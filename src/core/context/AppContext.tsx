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
  screen: 'MENU' | 'PLAY' | 'RESULTS';
  setScreen: (s: 'MENU' | 'PLAY' | 'RESULTS') => void;

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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<'MENU' | 'PLAY' | 'RESULTS'>('MENU');
  const [activeAdapter, setActiveAdapter] = useState(AVAILABLE_ADAPTERS[0]);
  const [config, setConfig] = useState(AVAILABLE_ADAPTERS[0].defaultConfig);

  const [cityData, setCityData] = useState<any[]>([]);
  const [roadData, setRoadData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [lastGameResult, setLastGameResult] = useState<LastGameResult | null>(null);
  const [replayOptions, setReplayOptions] = useState<ReplayOptions | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('/nl-quiz/data/cities.json').then(r => r.json()).catch(() => ({ features: [] })),
      fetch('/nl-quiz/data/roads.json').then(r => r.json()).catch(() => ({ features: [] }))
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

  const handleSetAdapter = (adapter: GameModeAdapter<any, any>) => {
    setActiveAdapter(adapter);
    setConfig(adapter.defaultConfig);
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
