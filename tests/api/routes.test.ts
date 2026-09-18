import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import { getAgeOverview, getHallmarksAtAge, getSystemsAtAge } from '@/domain/timeline/engine';
import { compareAges } from '@/domain/compare/engine';
import { badgeFor } from '@/domain/evidence/engine';
import { getTargetDetail, getTargets } from '@/domain/rejuvenation/engine';
import { scanText } from '@/domain/safety/banned-patterns';
import { DEFAULT_POPULATION } from '@/lib/api';

const b = getBundle();

/**
 * The route handlers are thin: parse, call an engine, wrap in the envelope. So
 * these tests assert the properties the envelope and the handler contracts are
 * responsible for, and the engine tests cover the logic underneath.
 */
describe('API contracts (FR-15)', () => {
  it('serves the default population, which the payload names (§15)', () => {
    // Static routes never see a query string, so they must not appear to accept
    // one. The payload identifies its own population instead.
    const overview = getAgeOverview(b, { age: 70, populationId: DEFAULT_POPULATION });
    expect(overview.population.id).toBe(DEFAULT_POPULATION);
    expect(overview.population.caveats.length).toBeGreaterThan(0);
  });

  it('carries a coverage report on every age payload', () => {
    const overview = getAgeOverview(b, { age: 70, populationId: DEFAULT_POPULATION });
    expect(overview.coverage).toHaveProperty('observed');
    expect(overview.coverage).toHaveProperty('entitiesWithoutData');
    expect(overview.coverage).toHaveProperty('missingRanges');
  });

  it('returns a stable shape at every age the slider can reach', () => {
    for (const age of [0, 1, 25, 50, 70, 90, 100]) {
      const ctx = { age, populationId: DEFAULT_POPULATION };
      expect(getHallmarksAtAge(b, ctx)).toHaveLength(12);
      expect(getSystemsAtAge(b, ctx)).toHaveLength(12);
      expect(() => getAgeOverview(b, ctx)).not.toThrow();
    }
  });

  it('never emits a prohibited claim in any serialised payload', () => {
    const payloads: Record<string, unknown> = {
      overview: getAgeOverview(b, { age: 70, populationId: DEFAULT_POPULATION }),
      hallmarks: getHallmarksAtAge(b, { age: 70, populationId: DEFAULT_POPULATION }),
      compare: compareAges(b, {
        ageA: 30,
        ageB: 70,
        dimensions: [],
        populationId: DEFAULT_POPULATION,
      }),
      targets: getTargets(b),
      evidence: badgeFor(b.evidenceProfiles[0]!),
    };

    for (const [name, payload] of Object.entries(payloads)) {
      const hits = scanText(`api/${name}`, JSON.stringify(payload, null, 1));
      expect(
        hits.map((h) => `${h.patternId}: ${h.excerpt}`),
        `in ${name}`,
      ).toEqual([]);
    }
  });

  it('never emits a biological-age estimate or a numeric score', () => {
    const everything = JSON.stringify({
      overview: getAgeOverview(b, { age: 70, populationId: DEFAULT_POPULATION }),
      targets: getTargets(b).map((t) => getTargetDetail(b, t.target_id)),
      evidence: b.evidenceProfiles.map(badgeFor),
    });
    expect(everything).not.toMatch(/"(?:biological_age|age_estimate|overall_score|aging_percent)"/);
  });

  it('ships the systemic caveat with every rejuvenation payload (§19)', () => {
    expect(b.disclaimers.systemic_caveat).toMatch(/does not establish whole-organism/i);
    for (const t of getTargets(b)) {
      const detail = getTargetDetail(b, t.target_id);
      expect(detail?.chain.find((s) => s.step === 'risks')?.content.length).toBeGreaterThan(0);
      expect(detail?.chain.find((s) => s.step === 'unknowns')?.content.length).toBeGreaterThan(0);
    }
  });

  it('prerenders a manageable number of static paths', () => {
    // 121 ages × 3 routes plus per-entity routes; if this grows unexpectedly,
    // build time is about to become a problem.
    expect(b.entities.length).toBeLessThan(500);
    expect(b.hallmarks.length + b.studies.length + b.evidenceProfiles.length).toBeLessThan(500);
  });
});
