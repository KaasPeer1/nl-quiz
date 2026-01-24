import type { GameModeDefinition } from '../../types';
import { CityConfigPanel } from './components/CityConfigPanel';
import { CityInfoCard } from './components/CityInfoCard';
import { useCityGameLogic } from './hooks/useCityGameLogic';
import { CityLayers } from './layers/CityLayers';
import type { CityConfig } from './types';

export const CityGameMode: GameModeDefinition<CityConfig> = {
  id: 'city-quiz',
  label: "menu.modes.cities.label",
  description: "menu.modes.cities.description",
  defaultConfig: {
    minPopulation: 10000,
    maxPopulation: 1000000,
    selectedProvinces: [], // "Drenthe", "Flevoland", "Fryslân", "Gelderland", "Groningen", "Limburg", "Noord-Brabant", "Noord-Holland", "Overijssel", "Utrecht", "Zeeland", "Zuid-Holland"
    mode: 'POINT'
  },
  ConfigComponent: CityConfigPanel,
  useGameLogic: useCityGameLogic,
  MapLayers: CityLayers,
  InfoCardComponent: CityInfoCard,
};
