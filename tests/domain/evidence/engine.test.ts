import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import { badgeFor, getProfile, resolveCitations, stalenessOf } from '@/domain/evidence/engine';
import { EVIDENCE_DIMENSION_KEYS } from '@schemas/index';

const b = getBundle();

describe('evidence engine (FR-09/FR-10)', () => {
  it('returns all eight §37 dimensions alongside the label', () => {
    const profile = getProfile(b, 'prof_cellular_senescence');
    expect(profile).not.toBeNull();
    const badge = badgeFor(profile!);
    expect(badge.basis).toHaveLength(8);
    expect(badge.basis.map((d) => d.key)).toEqual([...EVIDENCE_DIMENSION_KEYS]);
  });

  it('uses the AUTHORED label and does not derive it from the dimensions', () => {
    // §37's rule is that evidence must not collapse to one number. The most
    // likely future regression is someone "improving" badgeFor into an average
    // over dimension ratings. Downgrading every dimension must not move the
    // label, because the label is a human judgement, not a computation.
    const profile = getProfile(b, 'prof_cellular_senescence')!;
    const weakened = {
      ...profile,
      dimensions: Object.fromEntries(
        EVIDENCE_DIMENSION_KEYS.map((k) => [
          k,
          { ...profile.dimensions[k], rating: 'very_limited' as const },
        ]),
      ) as typeof profile.dimensions,
    };
    expect(badgeFor(weakened).label).toBe(profile.overall_label);
  });

  it('always carries the written justification for the label', () => {
    for (const profile of b.evidenceProfiles) {
      expect(badgeFor(profile).labelBasis.length).toBeGreaterThan(20);
    }
  });

  it('exposes no numeric score anywhere in a badge', () => {
    const serialized = JSON.stringify(badgeFor(b.evidenceProfiles[0]!));
    expect(serialized).not.toMatch(/"score"|"value"|"percent"|"points"/);
  });

  it('resolves citations to real studies, and reports the ones it cannot', () => {
    const resolved = resolveCitations(b, [
      { source_id: 'SRC-001', supports: 'direct' },
      { source_id: 'SRC-999', supports: 'direct' },
    ]);
    expect(resolved[0]?.study?.title).toMatch(/Hallmarks of Aging/i);
    expect(resolved[1]?.study).toBeNull();
  });

  it('flags evidence by when it was last checked, not when it was published', () => {
    const old1961 = { ...b.studies.find((s) => s.year === 1961)!, last_checked_at: '2026-09-01' };
    expect(stalenessOf(old1961, new Date('2026-09-18')).flag).toBe('current');

    const recentButUnchecked = { ...b.studies[0]!, last_checked_at: '2018-01-01' };
    expect(stalenessOf(recentButUnchecked, new Date('2026-09-18')).flag).toBe('stale');
  });

  it('marks the three-to-five year window as aging rather than stale', () => {
    const s = { ...b.studies[0]!, last_checked_at: '2022-01-01' };
    expect(stalenessOf(s, new Date('2026-09-18')).flag).toBe('aging');
  });
});
