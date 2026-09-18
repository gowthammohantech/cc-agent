import type { Observation } from '@schemas/index';
import type { RawContent } from '@/content/load';

export const MIN_AGE = 0;
export const MAX_AGE = 130;

/**
 * Observations bucketed by integer age.
 *
 * Each observation covers an age range, so a naive lookup would scan the whole
 * corpus on every slider tick. Precomputing 0..130 buckets makes the lookup an
 * array index, which is the mechanism behind §43's sub-100ms update target.
 */
export interface AgeIndex {
  observationsAt(age: number): readonly string[];
  /** Ages, within the supported span, for which no observation exists at all. */
  readonly emptyAges: readonly number[];
}

export function buildAgeIndex(content: Pick<RawContent, 'observations'>): AgeIndex {
  const buckets: string[][] = Array.from({ length: MAX_AGE + 1 }, () => []);

  const sorted: Observation[] = [...content.observations].sort((a, b) =>
    a.observation_id.localeCompare(b.observation_id),
  );

  for (const o of sorted) {
    const lo = Math.max(MIN_AGE, Math.floor(o.age_min));
    const hi = Math.min(MAX_AGE, Math.ceil(o.age_max));
    for (let age = lo; age <= hi; age++) {
      buckets[age]?.push(o.observation_id);
    }
  }

  const frozen: readonly (readonly string[])[] = buckets.map((b) => Object.freeze(b));
  const emptyAges = frozen.flatMap((b, age) => (b.length === 0 ? [age] : []));

  return {
    observationsAt(age: number): readonly string[] {
      const key = Math.round(age);
      if (key < MIN_AGE || key > MAX_AGE) return [];
      // noUncheckedIndexedAccess makes the missing case explicit rather than undefined.
      return frozen[key] ?? [];
    },
    emptyAges: Object.freeze(emptyAges),
  };
}
