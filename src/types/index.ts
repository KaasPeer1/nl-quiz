// Generic interface for any spatial feature (City, Road, Province)
export interface GameFeature {
  id: string;
  name: string;
  geometry: any; // GeoJSON
  [key: string]: any; // Extra props like population
}

export interface GameStats {
  correct: number;
  wrong: number;
  remaining: number;
  score: number; // generalized score (population or count)
  totalAreaPopulation: number;  // Population of ALL cities in the selected provinces (regardless of size)
}

export interface ReplayOptions {
  toPlayIds: string[];
  solvedIds: string[];
}

// The interface required for the Hook that runs a game
export interface GameLogicInterface {
  gameState: 'PLAYING' | 'FINISHED';
  currentStep: GameFeature | null;
  selectedFeature: GameFeature | null;
  feedback: 'CORRECT' | 'WRONG' | null;
  stats: GameStats;
  actions: {
    handleGuess: (input: string) => void;
    handleMapClick: (feature: GameFeature) => void;
    skip: () => void;
    giveUp: () => void;
    clearSelection: () => void;
  };
  // Data specifically formatted for the Map Layers
  layerData: {
    targets: GameFeature[];
    correct: GameFeature[];
    wrong: GameFeature[];
    lastWrong: GameFeature | null;
  };
  meta?: Record<string, any>;
}

// Definition of a Game Mode
export interface GameModeDefinition<ConfigType> {
  id: string;
  label: string;
  description: string;
  defaultConfig: ConfigType;
  // Component to render in settings
  ConfigComponent: React.FC<{
    config: ConfigType;
    onChange: (newConfig: ConfigType) => void;
  }>;
  // Hook to run logic
  useGameLogic: (data: any[], config: ConfigType, replay?: ReplayOptions) => GameLogicInterface;
  // Component to render Map Layers
  MapLayers: React.FC<{
    logic: GameLogicInterface;
    onFeatureClick: (feature: GameFeature) => void;
  }>;
  InfoCardComponent?: React.FC<{
    feature: GameFeature;
    onClose: () => void;
    onSelect: (feature: GameFeature) => void;
  }>;
}
