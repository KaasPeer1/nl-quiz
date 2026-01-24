// Generic interface for any spatial feature (City, Road, Province)
export interface GameFeature {
  id: string;
  name: string;
  geometry: any; // GeoJSON
  [key: string]: any; // Extra props (population, etc)
}

// How we define a Game Mode (City Quiz, Road Quiz, etc.)
export interface GameModeDefinition<ConfigType> {
  id: string;
  label: string;
  // The Component to render in the settings menu
  ConfigComponent: React.FC<{
    config: ConfigType;
    onChange: (newConfig: ConfigType) => void;
  }>;
  // The default config
  defaultConfig: ConfigType;
  // The hook that runs the game logic
  useGameLogic: (data: any[], config: ConfigType) => GameLogicInterface;
  // The Map Layers specific to this mode
  MapLayers: React.FC<MapLayerProps>;
}

export interface GameLogicInterface {
  gameState: 'PLAYING' | 'FINISHED';
  currentTarget: GameFeature | null;
  feedback: 'CORRECT' | 'WRONG' | null;
  stats: {
    correct: number;
    wrong: number;
    remaining: number;
    score: number; // generalized score (population or count)
  };
  actions: {
    handleGuess: (input: string) => void;
    handleMapClick: (feature: GameFeature) => void;
    skip: () => void;
    giveUp: () => void;
  };
  // Data for the map
  mapState: {
    targets: GameFeature[];
    correct: GameFeature[];
    wrong: GameFeature[];
    lastWrong: GameFeature | null;
  };
}

export interface MapLayerProps {
  logic: GameLogicInterface;
  onFeatureClick: (feature: GameFeature) => void;
}
