import type { GameFeature } from "../../core/types";

export interface City extends GameFeature {
  aliases: string[];
  population: number;
  province: string;
}

export interface CityConfig {
  minPopulation: number;
  maxPopulation: number;
  selectedProvinces: string[];
  mode: 'POINT' | 'NAME' | 'EXPLORE';
}
