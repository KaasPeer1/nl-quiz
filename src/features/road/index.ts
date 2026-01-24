import { type GameModeDefinition } from '../../types';
import { RoadConfigPanel } from './components/RoadConfigPanel';
import { useRoadGameLogic } from './hooks/useRoadGameLogic';
import { RoadLayers } from './layers/RoadLayers';
import { type RoadConfig } from './types';
import { RoadInfoCard } from './components/RoadInfoCard';

export const RoadGameMode: GameModeDefinition<RoadConfig> = {
  id: 'road-quiz',
  label: "menu.modes.road.label",
  description: "menu.modes.road.description",
  defaultConfig: {
    minLength: 0,
    maxLength: 300,
    selectedTypes: ['A'],
    selectedProvinces: [],
    mode: 'POINT'
  },
  ConfigComponent: RoadConfigPanel,
  useGameLogic: useRoadGameLogic,
  MapLayers: RoadLayers,
  InfoCardComponent: RoadInfoCard
};
