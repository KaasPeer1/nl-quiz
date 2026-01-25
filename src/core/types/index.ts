// Generic interface for any spatial feature (City, Road, Province)
export interface GameFeature {
  id: string;
  name: string;
  geometry: any; // GeoJSON
  [key: string]: any; // Extra props like population, length, etc.
}

export interface Question<T = GameFeature> {
  id: string;
  prompt: string;
  payload: T;
}

export interface QuizState<T> {
  status: 'IDLE' | 'PLAYING' | 'FINISHED';
  queue: Question<T>[];
  currentQuestion: Question<T> | null;
  lastWrong: Question<T> | null;
  history: {
    correct: Question<T>[];
    wrong: Question<T>[];
  };
  feedback: 'CORRECT' | 'WRONG' | null;
  score: number; // Generalized score (might be total population, length, ...)
  stats: {
    total: number;
    remaining: number;
    correctCount: number;
    wrongCount: number;
  };
}

export interface ReplayOptions {
  toPlayIds: string[];
  solvedIds: string[];
}

// The contract every game mode must fulfill
export interface GameModeAdapter<ConfigType, FeatureType extends GameFeature> {
  id: string;
  label: string;
  description: string;
  defaultConfig: ConfigType;

  // Create the question queue based on config
  generateQuestions: (data: FeatureType[], config: ConfigType, replay?: ReplayOptions) => { queue: Question<FeatureType>[]; initialCorrect: Question<FeatureType>[] };

  // Check an answer (input) against the question and any context (i.e., aliases)
  validate: (question: Question<FeatureType>, input: string | FeatureType, context?: any) => boolean;

  // Calculate score value for a specific item (e.g. population vs length)
  getScoreValue: (feature: FeatureType) => number;


  // --- Components ---
  ConfigComponent: React.FC<{ config: ConfigType; onChange: (c: ConfigType) => void }>;

  MapLayers: React.FC<{
    gameState: QuizState<FeatureType>;
    onInteraction: (input: FeatureType | null) => void;
    config: ConfigType;
    selectedFeature: FeatureType | null;
  }>;

  InfoCardComponent?: React.FC<{
    feature: FeatureType;
    onClose: () => void;
    onSelect: (f: FeatureType) => void;
  }>;
}
