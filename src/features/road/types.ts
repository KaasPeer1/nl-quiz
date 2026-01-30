import { type GameFeature } from "../../core/types";
import type { LearningMixOptions } from "../../core/types/learning";

export interface Road extends GameFeature {
  type: 'A' | 'N' | 'S' | 'E';
  lengthKm: number;
  aliases: string[];
  connectedCityIds?: string[]; // For future use
}

export interface RoadConfig {
  minLength: number;
  maxLength: number;
  selectedTypes: ('A' | 'N' | 'S' | 'E')[];
  mode: 'NAME' | 'POINT' | 'EXPLORE';
  learnMode: boolean;
  learningOptions: LearningMixOptions;
}
