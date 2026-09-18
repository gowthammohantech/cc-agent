import { getBundle } from '@/content/bundle';
import {
  getAgeOverview,
  getHallmarksAtAge,
  getSystemsAtAge,
  type AgeOverview,
  type HallmarkState,
  type SystemState,
} from '@/domain/timeline/engine';

export interface AgeSnapshot {
  overview: AgeOverview;
  hallmarks: readonly HallmarkState[];
  systems: readonly SystemState[];
}

/**
 * §43's sub-100ms budget.
 *
 * The content bundle is a frozen module singleton, so the only inputs that vary
 * are the age and the population — which makes the memo key a two-part string
 * and makes scrubbing back and forth over a range free after the first pass.
 *
 * An LRU rather than an unbounded map because a user can visit 101 ages and we
 * would rather bound the memory than cache the entire lifespan.
 */
const CACHE_LIMIT = 32;
const cache = new Map<string, AgeSnapshot>();

export function selectAgeSnapshot(age: number, populationId: string): AgeSnapshot {
  const key = `${age}|${populationId}`;

  const hit = cache.get(key);
  if (hit) {
    // Refresh recency: delete and re-insert moves it to the end of the Map.
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  const bundle = getBundle();
  const ctx = { age, populationId };
  const snapshot: AgeSnapshot = {
    overview: getAgeOverview(bundle, ctx),
    hallmarks: getHallmarksAtAge(bundle, ctx),
    systems: getSystemsAtAge(bundle, ctx),
  };

  cache.set(key, snapshot);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }

  return snapshot;
}

export function clearSnapshotCache(): void {
  cache.clear();
}
