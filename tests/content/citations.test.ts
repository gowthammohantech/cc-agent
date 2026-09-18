import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import type { Provenance } from '@schemas/index';

const b = getBundle();

/** Every record in the corpus that makes a scientific claim. */
function claimBearing(): Array<{ where: string; provenance: Provenance }> {
  return [
    ...b.hallmarks.map((h) => ({ where: `hallmark ${h.id}`, provenance: h.provenance })),
    ...b.observations.map((o) => ({
      where: `observation ${o.observation_id}`,
      provenance: o.provenance,
    })),
    ...b.trajectories.map((t) => ({
      where: `trajectory ${t.trajectory_id}`,
      provenance: t.provenance,
    })),
    ...b.relationships.map((r) => ({
      where: `relationship ${r.relationship_id}`,
      provenance: r.provenance,
    })),
    ...b.rejuvenationTargets.map((t) => ({
      where: `target ${t.target_id}`,
      provenance: t.provenance,
    })),
    ...b.researchApproaches.map((a) => ({ where: `approach ${a.id}`, provenance: a.provenance })),
  ];
}

describe('citations and uncertainty', () => {
  it('gives every scientific claim at least one source', () => {
    const uncited = claimBearing()
      .filter((r) => r.provenance.citations.length === 0)
      .map((r) => r.where);
    expect(uncited).toEqual([]);
  });

  it('gives every scientific claim a stated uncertainty that says something', () => {
    const vague = claimBearing()
      .filter((r) => r.provenance.uncertainty.description.trim().length < 20)
      .map((r) => r.where);
    expect(vague).toEqual([]);
  });

  it('never cites a retracted source', () => {
    const retracted = new Set(b.studies.filter((s) => s.retracted).map((s) => s.source_id));
    const offenders = claimBearing()
      .filter((r) => r.provenance.citations.some((c) => retracted.has(c.source_id)))
      .map((r) => r.where);
    expect(offenders).toEqual([]);
  });

  it('requires a named reviewer and date wherever a record claims it was approved', () => {
    const bad = claimBearing()
      .filter(
        (r) =>
          r.provenance.review_status === 'approved' &&
          (r.provenance.reviewed_by === null || r.provenance.reviewed_at === null),
      )
      .map((r) => r.where);
    expect(bad).toEqual([]);
  });

  it('gives every source a resolvable identifier and at least one stated limitation', () => {
    const bad = b.studies
      .filter((s) => (s.doi === null && s.url === null) || s.limitations.length === 0)
      .map((s) => s.source_id);
    expect(bad).toEqual([]);
  });

  it('does not present unverified references as verified', () => {
    // No scholarly network egress in this environment, so nothing may claim
    // machine verification. If this fails, someone asserted a check that did
    // not happen.
    const overclaimed = b.studies
      .filter((s) => s.reference_verification !== 'unverified_offline' && s.verified_at === null)
      .map((s) => s.source_id);
    expect(overclaimed).toEqual([]);
  });

  it('leaves no source uncited — an unused source is a citation that lost its claim', () => {
    const cited = new Set<string>();
    for (const r of claimBearing()) for (const c of r.provenance.citations) cited.add(c.source_id);
    for (const e of b.entities) for (const c of e.citations) cited.add(c.source_id);
    for (const band of b.ageBands) for (const c of band.citations) cited.add(c.source_id);
    for (const t of b.rejuvenationTargets) {
      for (const g of [t.human_evidence, t.animal_evidence, t.in_vitro_evidence]) {
        for (const item of g) for (const c of item.citations) cited.add(c.source_id);
      }
      for (const risk of t.risks) for (const c of risk.citations) cited.add(c.source_id);
      for (const c of t.reversibility_demonstrated.citations) cited.add(c.source_id);
    }
    const orphans = b.studies.filter((s) => !cited.has(s.source_id)).map((s) => s.source_id);
    expect(orphans).toEqual([]);
  });
});
