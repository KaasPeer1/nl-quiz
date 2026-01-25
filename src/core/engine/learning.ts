import _ from 'lodash';
import type { GameFeature } from '../types';
import type { ProgressMap } from '../types/progress';
import { DEFAULT_LEARNING_CONFIG } from '../types/progress';
import { DEFAULT_MIX_OPTIONS } from '../types/learning';
import type { LearningMixOptions } from '../types/learning';

export function createLearningQueue<T extends GameFeature>(
  allData: T[],
  progress: ProgressMap,
  scoreFn: (item: T) => number, // e.g., population or length
  options: Partial<LearningMixOptions> = {}
): T[] {
  const cfg = { ...DEFAULT_MIX_OPTIONS, ...options };
  const { maxLevel } = DEFAULT_LEARNING_CONFIG;

  // Bucketing
  const buckets = {
    new: [] as T[],
    active: [] as T[],
    mastered: [] as T[]
  };

  allData.forEach(item => {
    const p = progress[item.id];
    if (!p || p.level === 0) {
      buckets.new.push(item);
    } else if (p.level < maxLevel) {
      buckets.active.push(item);
    } else {
      buckets.mastered.push(item);
    }
  });

  // Sort "New" items by score (Population/Length) descending
  // This ensures we learn big cities before small villages
  buckets.new.sort((a, b) => scoreFn(b) - scoreFn(a));

  // Target counts
  // We only take new cities if the active pool is small enough (less than 3x batch size)
  const countNew = buckets.active.length < 3 * cfg.batchSize ? Math.floor(cfg.batchSize * cfg.newRatio) : 0;
  const countActive = Math.floor(cfg.batchSize * cfg.activeRatio);
  const countReview = cfg.batchSize - countNew - countActive;

  // Selection
  const queue: T[] = [];

  // -- Select NEW --
  // Take top N (randomness), shuffle them, take target count
  const newPool = buckets.new.slice(0, cfg.randomness);
  queue.push(..._.sampleSize(newPool, countNew));

  // -- Select ACTIVE --
  // Simple sample of all active items
  queue.push(..._.sampleSize(buckets.active, countActive));

  // -- Select MASTERED --
  // Simple sample
  queue.push(..._.sampleSize(buckets.mastered, countReview));

  // Backfilling
  // If we didn't meet the batchSize (e.g., user has 0 active items), fill with New
  if (queue.length < cfg.batchSize) {
    const missing = cfg.batchSize - queue.length;
    // Get more new items, excluding ones we already picked
    const currentIds = new Set(queue.map(i => i.id));
    const remainingNew = buckets.new.filter(i => !currentIds.has(i.id));

    // We broaden the pool for backfill to ensure we find enough
    const backfillPool = remainingNew.slice(0, cfg.randomness * 2);
    queue.push(..._.sampleSize(backfillPool, missing));
  }

  // If still missing (no new items left?), fill with Mastered
  if (queue.length < cfg.batchSize) {
    const missing = cfg.batchSize - queue.length;
    const currentIds = new Set(queue.map(i => i.id));
    const remainingMastered = buckets.mastered.filter(i => !currentIds.has(i.id));
    queue.push(..._.sampleSize(remainingMastered, missing));
  }

  // Final Shuffle so the user doesn't get all "New" items in a row
  return _.shuffle(queue);
}
