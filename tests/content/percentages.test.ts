import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';

/**
 * §31 — "Do not store invented universal percentages."
 *
 * The schema already confines numbers to a cited `quantitative` effect. This
 * closes the remaining route: a figure written into prose, where no schema can
 * see it. A percentage or fold-change in a text field is only allowed when the
 * same record carries a cited quantitative effect that could have produced it.
 */
const PERCENT = /\d+(?:\.\d+)?\s*%/;
// `[\s-]*` matters: "3-fold" is the common spelling and a whitespace-only
// separator would miss it entirely.
const FOLD = /\b\d+(?:\.\d+)?[\s-]*(?:x|fold|times)\b/i;

describe('no invented numbers in prose (§31)', () => {
  const b = getBundle();

  it('allows a figure in an observation only when a cited quantitative effect backs it', () => {
    const offenders: string[] = [];
    for (const o of b.observations) {
      const prose = [
        o.observation,
        o.provenance.uncertainty.description,
        ...o.provenance.uncertainty.known_conflicts,
        o.effect.kind === 'qualitative' ? o.effect.statement : '',
        o.effect.kind === 'not_quantified' ? o.effect.reason : '',
      ].join(' • ');

      if ((PERCENT.test(prose) || FOLD.test(prose)) && o.effect.kind !== 'quantitative') {
        offenders.push(`${o.observation_id}: ${prose.slice(0, 120)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps figures out of hallmark, relationship and target prose', () => {
    const offenders: string[] = [];

    for (const h of b.hallmarks) {
      const prose = h.description;
      if (PERCENT.test(prose) || FOLD.test(prose)) offenders.push(`hallmark ${h.id}`);
    }
    for (const r of b.relationships) {
      const prose = `${r.mechanism_note ?? ''} ${r.provenance.uncertainty.description}`;
      if (PERCENT.test(prose) || FOLD.test(prose))
        offenders.push(`relationship ${r.relationship_id}`);
    }
    for (const t of b.rejuvenationTargets) {
      const prose = [
        t.desired_direction,
        ...t.unknowns,
        ...t.risks.map((x) => x.risk),
        t.reversibility_demonstrated.note,
      ].join(' • ');
      if (PERCENT.test(prose) || FOLD.test(prose)) offenders.push(`target ${t.target_id}`);
    }

    expect(offenders).toEqual([]);
  });

  it('requires every quantitative effect to name the source that reported it', () => {
    const bad = b.observations
      .filter((o) => o.effect.kind === 'quantitative' && !o.effect.source_reported)
      .map((o) => o.observation_id);
    expect(bad).toEqual([]);
  });

  it('catches an invented figure if one is added', () => {
    // Guards the guard: if this stops matching, the check above is inert.
    expect(PERCENT.test('muscle mass falls by 40% after age 60')).toBe(true);
    expect(FOLD.test('senescent burden rises 3-fold')).toBe(true);
    expect(FOLD.test('senescent burden rises 3 fold')).toBe(true);
    expect(FOLD.test('a twofold increase')).toBe(false); // spelled out, not a figure
    expect(PERCENT.test('muscle mass declines with age')).toBe(false);
  });
});
