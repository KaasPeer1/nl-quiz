import { type GameFeature } from "../../types";

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
  selectedProvinces: string[];
  mode: 'NAME' | 'POINT' | 'EXPLORE';
}
