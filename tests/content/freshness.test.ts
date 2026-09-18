import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';

/**
 * FR-17 — "flag outdated evidence". Evidence rot is silent by nature: nothing
 * breaks when a citation ages, so it has to be surfaced deliberately.
 *
 * `last_checked_at` is when we last looked at the source, not the year it was
 * published. A 1961 paper that was checked this year is current for this test's
 * purposes; a 2023 paper nobody has revisited in a decade is not.
 */
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

function yearsSince(dateIso: string, now: Date): number {
  return (now.getTime() - new Date(dateIso).getTime()) / YEAR_MS;
}

describe('evidence freshness', () => {
  const b = getBundle();
  const now = new Date();

  it('has no source left unchecked for more than seven years', () => {
    const stale = b.studies
      .filter((s) => yearsSince(s.last_checked_at, now) > 7)
      .map((s) => `${s.source_id} (last checked ${s.last_checked_at})`);
    expect(stale).toEqual([]);
  });

  it('reports which sources are approaching staleness', () => {
    const aging = b.studies
      .filter((s) => yearsSince(s.last_checked_at, now) > 3)
      .map((s) => s.source_id);
    if (aging.length > 0) {
      console.warn(`Sources not re-checked in over 3 years: ${aging.join(', ')}`);
    }
    expect(Array.isArray(aging)).toBe(true);
  });

  it('has no evidence profile reviewed more than five years ago', () => {
    const stale = b.evidenceProfiles
      .filter((p) => yearsSince(p.last_reviewed_at, now) > 5)
      .map((p) => p.profile_id);
    expect(stale).toEqual([]);
  });
});
