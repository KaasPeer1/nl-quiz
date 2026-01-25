export interface LearningMixOptions {
  batchSize: number;
  newRatio: number;
  maxActive: number;
  activeRatio: number;
  randomness: number;
}

export const DEFAULT_MIX_OPTIONS: LearningMixOptions = {
  batchSize: 20,
  newRatio: 0.1,
  maxActive: 60,
  activeRatio: 0.7,
  randomness: 10
};
