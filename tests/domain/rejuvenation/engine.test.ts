import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import { explorerView, getTargetDetail, getTargets } from '@/domain/rejuvenation/engine';

const b = getBundle();

describe('rejuvenation engine (FR-07)', () => {
  it('returns every target, deterministically ordered', () => {
    const ids = getTargets(b).map((t) => t.target_id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toEqual([...ids].sort());
  });

  it('filters by hallmark, scope and clinical status', () => {
    expect(
      getTargets(b, { hallmarkId: 'cellular_senescence' }).every(
        (t) => t.aging_process === 'cellular_senescence',
      ),
    ).toBe(true);
    expect(
      getTargets(b, { scope: 'functional' }).every((t) => t.rejuvenation_scope === 'functional'),
    ).toBe(true);
    expect(
      getTargets(b, { clinicalStatus: 'standard_of_care' }).every(
        (t) => t.clinical_status === 'standard_of_care',
      ),
    ).toBe(true);
  });

  it('never publishes a target without at least one risk and one unknown', () => {
    // The schema enforces this, but it is the property that stops a target
    // reading as an endorsement, so it is worth asserting where it is used.
    for (const t of getTargets(b)) {
      expect(t.risks.length).toBeGreaterThan(0);
      expect(t.unknowns.length).toBeGreaterThan(0);
    }
  });

  it("materialises §18's seven-step chain in order", () => {
    const detail = getTargetDetail(b, getTargets(b)[0]!.target_id);
    expect(detail).not.toBeNull();
    expect(detail!.chain.map((s) => s.step)).toEqual([
      'observed_state',
      'candidate_target',
      'mechanism',
      'research_approach',
      'evidence_level',
      'risks',
      'unknowns',
    ]);
    expect(detail!.chain.every((s) => s.content.length > 0)).toBe(true);
  });

  it('resolves the process name and its research approaches', () => {
    const detail = getTargetDetail(b, 'target_001')!;
    expect(detail.processName).toBe('Cellular Senescence');
    expect(detail.approaches.length).toBeGreaterThan(0);
  });

  it('returns null for an unknown target', () => {
    expect(getTargetDetail(b, 'target_999')).toBeNull();
  });

  it('keeps the systemic caveat on every explorer view', () => {
    // §19 — a list of targets reads as a checklist unless this stays on screen.
    const view = explorerView(b, { selectedAge: 70, referenceAge: 30 });
    expect(view.systemicCaveat).toMatch(/does not establish whole-organism rejuvenation/i);
    expect(view.rows.length).toBeGreaterThan(0);
    expect(view.selectedAge).toBe(70);
    expect(view.referenceAge).toBe(30);
  });

  it('tracks reversibility separately per species, never merged', () => {
    for (const t of getTargets(b)) {
      const r = t.reversibility_demonstrated;
      expect(['yes', 'partial', 'no', 'unknown']).toContain(r.in_humans);
      expect(['yes', 'partial', 'no', 'unknown']).toContain(r.in_animals);
      expect(['yes', 'partial', 'no', 'unknown']).toContain(r.in_vitro);
    }
  });

  it('claims no whole-organism reversal anywhere in the corpus', () => {
    // §49 — the strongest claim, which nothing here is entitled to make.
    const wholeOrganism = getTargets(b).filter((t) => t.rejuvenation_scope === 'whole_organism');
    expect(wholeOrganism).toEqual([]);
    expect(getTargets(b).every((t) => t.reversibility_demonstrated.in_humans !== 'yes')).toBe(true);
  });
});
