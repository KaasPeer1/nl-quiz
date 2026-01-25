export interface ItemProgress {
  level: number;  // 0 = new, 1..4 = learning, 5 = mastered
  streak: number;
  totalCorrect: number;
  totalWrong: number;
  lastSeen: number;  // Timestamp
}

export type ProgressMap = Record<string, ItemProgress>;

export interface LearningConfig {
  streakThreshold: number;  // After how many correct in a row do we move up a level?
  maxLevel: number;
}

export const DEFAULT_LEARNING_CONFIG: LearningConfig = {
  streakThreshold: 2,
  maxLevel: 5,
};
