import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import { runSimulation } from '@/domain/simulation/engine';
import { serializeSimulation } from '@/domain/simulation/serialize';
import { SimulationInputSchema } from '@schemas/index';

const b = getBundle();

const input = SimulationInputSchema.parse({
  chronological_age: 70,
  reference_age: 30,
  modifications: [{ target: 'cellular_senescence', direction: 'reduce' }],
});

describe('simulation engine (FR-08)', () => {
  it('produces a non-empty propagation over the shipped corpus', () => {
    /*
     * This is the test the design correction demanded. The original filter
     * required review_status === 'approved'; the seed corpus ships in_review,
     * so that combination would have blocked every edge and returned an empty
     * simulation that looked like a working feature.
     */
    const out = runSimulation(b, input);
    expect(out.affected_nodes.length).toBeGreaterThan(0);
  });

  it('never emits a magnitude, score or age field', () => {
    const out = runSimulation(b, input);
    const json = JSON.stringify(out);
    expect(json).not.toMatch(/"(biological_age|age_estimate|score|percent|magnitude)"/);
    // Direction is a four-value enum; there is nothing numeric to misread.
    for (const node of out.affected_nodes) {
      expect([
        'toward_younger_reference',
        'toward_older_state',
        'indeterminate',
        'unsupported',
      ]).toContain(node.direction);
    }
  });

  it('is deterministic — identical input yields byte-identical output', () => {
    expect(JSON.stringify(runSimulation(b, input))).toBe(JSON.stringify(runSimulation(b, input)));
    expect(runSimulation(b, input).run_id).toBe(runSimulation(b, input).run_id);
  });

  it('changes the run id when the question changes', () => {
    const other = SimulationInputSchema.parse({
      ...input,
      modifications: [{ target: 'cellular_senescence', direction: 'improve' }],
    });
    expect(runSimulation(b, other).run_id).not.toBe(runSimulation(b, input).run_id);
  });

  it('ties the run to a model version and a content version', () => {
    const out = runSimulation(b, input);
    expect(out.model_version).toBe('v1');
    expect(out.content_version).toBe(b.contentVersion);
  });

  it('never propagates a correlational edge (§6 Principle 4)', () => {
    const out = runSimulation(b, input);
    const traversed = new Set(out.affected_nodes.flatMap((n) => n.path.edges));

    for (const id of traversed) {
      const edge = b.indexes.relationshipById.get(id);
      expect(edge?.provenance.causal_status, `edge ${id} should not have propagated`).not.toBe(
        'correlational_only',
      );
      expect(edge?.relationship).not.toBe('ASSOCIATED_WITH');
    }
  });

  it('reports blocked edges rather than dropping them silently', () => {
    // Where the model stops is the most honest thing it can say, so it is
    // output rather than an omission.
    const out = runSimulation(b, input);
    expect(out.unsupported_relationships.length).toBeGreaterThan(0);
    for (const blocked of out.unsupported_relationships) {
      expect(blocked.explanation.length).toBeGreaterThan(20);
    }
  });

  it('explains a correlational block in plain words', () => {
    const out = runSimulation(b, {
      ...input,
      modifications: [{ target: 'dysbiosis', direction: 'improve' }],
    });
    const correlational = out.unsupported_relationships.filter(
      (e) => e.reason === 'causal_status_correlational_only',
    );
    if (correlational.length > 0) {
      expect(correlational[0]?.explanation).toMatch(/moving together does not mean/i);
    }
  });

  it('always states that whole-organism reversal is not supported', () => {
    const out = runSimulation(b, input);
    expect(out.whole_organism_claim).toBe('not_supported');
    const whole = out.scope_summary.find((s) => s.scope === 'whole_organism');
    expect(whole?.statement).toMatch(/Not supported/);
  });

  it('carries the §21 disclaimer verbatim', () => {
    expect(runSimulation(b, input).disclaimer).toMatch(/NOT A CLINICAL PREDICTION/);
    expect(runSimulation(b, input).not_a_clinical_prediction).toBe(true);
  });

  it('describes the bounds of what it does not model', () => {
    const out = runSimulation(b, input);
    expect(out.bounds_description).toMatch(/does not model magnitude, timing, dose/i);
  });

  it('respects the depth limit and reports where it stopped', () => {
    const out = runSimulation(b, input);
    for (const node of out.affected_nodes) {
      expect(node.path.depth).toBeLessThanOrEqual(b.simulationModel.max_depth);
    }
  });

  it('accepts several modifications at once', () => {
    const multi = SimulationInputSchema.parse({
      ...input,
      modifications: [
        { target: 'cellular_senescence', direction: 'reduce' },
        { target: 'disabled_macroautophagy', direction: 'restore' },
      ],
    });
    expect(runSimulation(b, multi).affected_nodes.length).toBeGreaterThan(0);
  });
});

describe('simulation safety serialization', () => {
  it('passes a well-formed result through unchanged', () => {
    const out = runSimulation(b, input);
    expect(serializeSimulation(out)).toBe(out);
  });

  it('throws if the disclaimer is stripped', () => {
    const out = runSimulation(b, input);
    expect(() => serializeSimulation({ ...out, disclaimer: 'Results below.' })).toThrow(/SAFETY/);
  });

  it('throws if the whole-organism claim is altered', () => {
    const out = runSimulation(b, input);
    expect(() =>
      serializeSimulation({
        ...out,
        whole_organism_claim: 'supported' as unknown as 'not_supported',
      }),
    ).toThrow(/whole-organism/);
  });

  it('throws if a forbidden field is introduced anywhere in the payload', () => {
    // Guards against a future "helpful" addition rather than today's code.
    const out = runSimulation(b, input);
    expect(() =>
      serializeSimulation({ ...out, biological_age: 42 } as unknown as typeof out),
    ).toThrow(/forbidden field/);
    expect(() =>
      serializeSimulation({
        ...out,
        input_echo: { ...out.input_echo, overall_score: 0.8 },
      } as unknown as typeof out),
    ).toThrow(/forbidden field/);
  });

  it('throws if prohibited phrasing reaches the payload', () => {
    const out = runSimulation(b, input);
    expect(() =>
      serializeSimulation({ ...out, bounds_description: 'This is clinically proven to work.' }),
    ).toThrow(/SAFETY/);
  });
});

describe('sign convention', () => {
  /**
   * Caught by looking at a screenshot, not by a test: the simulate page seeded
   * hallmark modifications as 'improve' (+1), which inverted every chain. The
   * edge signs encode QUANTITY — DAMAGES is -1 because more of the damager
   * means worse function downstream — so an improvement to a named dysfunction
   * is always a reduction in its quantity.
   */
  it('traces reducing a dysfunction to a better downstream state', () => {
    const out = runSimulation(
      b,
      SimulationInputSchema.parse({
        chronological_age: 70,
        reference_age: 30,
        modifications: [{ target: 'altered_intercellular_communication', direction: 'reduce' }],
      }),
    );

    // reduce communication alteration (-1)
    //   --CONTRIBUTES_TO(+1)--> less stem-cell exhaustion (-1)
    //   --DAMAGES(-1)--------> better bone marrow (+1)
    const marrow = out.affected_nodes.find((n) => n.node_id === 'bone_marrow');
    expect(marrow?.direction).toBe('toward_younger_reference');
  });

  it('reports less of a dysfunction as an improvement, not a regression', () => {
    // A hallmark names a dysfunction, so reducing it is progress — reporting it
    // with the same rule as a structure's function was actively misleading.
    const out = runSimulation(
      b,
      SimulationInputSchema.parse({
        chronological_age: 70,
        reference_age: 30,
        modifications: [{ target: 'altered_intercellular_communication', direction: 'reduce' }],
      }),
    );
    const exhaustion = out.affected_nodes.find((n) => n.node_id === 'stem_cell_exhaustion');
    expect(exhaustion?.direction).toBe('toward_younger_reference');
  });

  it('traces increasing a dysfunction to a worse downstream state', () => {
    const out = runSimulation(
      b,
      SimulationInputSchema.parse({
        chronological_age: 70,
        reference_age: 30,
        modifications: [{ target: 'altered_intercellular_communication', direction: 'improve' }],
      }),
    );
    // 'improve' seeds +1, i.e. MORE of the named alteration — the opposite.
    const marrow = out.affected_nodes.find((n) => n.node_id === 'bone_marrow');
    expect(marrow?.direction).toBe('toward_older_state');
  });

  it('gives reducing senescence a coherent downstream story', () => {
    const out = runSimulation(b, input);
    const muscle = out.affected_nodes.find((n) => n.node_id === 'skeletal_muscle');
    if (muscle) expect(muscle.direction).toBe('toward_younger_reference');
  });
});
