import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import { propagate } from '@/domain/simulation/propagate';
import { RelationshipSchema, SimulationModelSchema, type Relationship } from '@schemas/index';

const b = getBundle();

/**
 * Conflict handling deserves a synthetic graph: the behaviour that matters is
 * what happens when two supported paths disagree, and relying on the seed
 * corpus to contain such a pair would make the test hostage to content edits.
 */
function edge(id: string, from: string, to: string, relationship: Relationship['relationship']) {
  return RelationshipSchema.parse({
    relationship_id: id,
    from_node: from,
    to_node: to,
    relationship,
    directionality: 'directed',
    age_context: null,
    mechanism_note: null,
    provenance: {
      evidence_level: 'animal',
      causal_status: 'supported_mechanistically',
      review_status: 'in_review',
      confidence: 'high',
      citations: [{ source_id: 'SRC-001', supports: 'direct' }],
      uncertainty: {
        description: 'Synthetic edge used only for engine tests.',
        known_conflicts: [],
        generalizability: 'population_average',
      },
      reviewed_by: null,
      reviewed_at: null,
      record_version: 1,
    },
  });
}

function bundleWith(edges: Relationship[]) {
  const outgoing = new Map<string, Relationship[]>();
  for (const e of edges) {
    const list = outgoing.get(e.from_node) ?? [];
    list.push(e);
    outgoing.set(e.from_node, list);
  }
  return {
    ...b,
    relationships: edges,
    indexes: {
      ...b.indexes,
      outgoing,
      relationshipById: new Map(edges.map((e) => [e.relationship_id, e])),
    },
  };
}

describe('conflicting evidence', () => {
  it('marks a node indeterminate and keeps BOTH paths', () => {
    // seed --REPAIRS--> target  (improves)
    // seed --DAMAGES--> target  (worsens)
    const edges = [
      edge('rel_901', 'seed_node', 'target_node', 'REPAIRS'),
      edge('rel_902', 'seed_node', 'target_node', 'DAMAGES'),
    ];

    const result = propagate(
      bundleWith(edges),
      b.simulationModel,
      [{ nodeId: 'seed_node', sign: 1 }],
      70,
    );

    const target = result.nodes.get('target_node');
    expect(target?.sign, 'opposing evidence must not resolve to a direction').toBe(0);
    // Averaging opposing evidence into a net direction would manufacture a
    // conclusion the evidence does not contain.
    expect(target?.conflicting).toHaveLength(2);
  });

  it('does not propagate onward from an indeterminate node', () => {
    const edges = [
      edge('rel_901', 'seed_node', 'target_node', 'REPAIRS'),
      edge('rel_902', 'seed_node', 'target_node', 'DAMAGES'),
      edge('rel_903', 'target_node', 'downstream_node', 'REPAIRS'),
    ];

    const result = propagate(
      bundleWith(edges),
      b.simulationModel,
      [{ nodeId: 'seed_node', sign: 1 }],
      70,
    );

    // A direction the model could not determine must not become a premise.
    expect(result.nodes.get('downstream_node')).toBeUndefined();
  });

  it('inverts the sign across an INHIBITS edge', () => {
    const result = propagate(
      bundleWith([edge('rel_901', 'seed_node', 'target_node', 'INHIBITS')]),
      b.simulationModel,
      [{ nodeId: 'seed_node', sign: 1 }],
      70,
    );
    expect(result.nodes.get('target_node')?.sign).toBe(-1);
  });

  it('blocks an edge whose age context excludes the selected age', () => {
    const scoped = {
      ...edge('rel_901', 'seed_node', 'target_node', 'REPAIRS'),
      age_context: { age_min: 20, age_max: 40 },
    };

    const result = propagate(
      bundleWith([scoped]),
      b.simulationModel,
      [{ nodeId: 'seed_node', sign: 1 }],
      70,
    );

    expect(result.nodes.get('target_node')).toBeUndefined();
    expect(result.blocked[0]?.reason).toBe('outside_age_context');
  });

  it('truncates a chain once confidence falls below the floor', () => {
    const weak = SimulationModelSchema.parse({
      ...b.simulationModel,
      confidence_multipliers: { ...b.simulationModel.confidence_multipliers, high: 0.2 },
      min_confidence: 0.15,
    });

    const edges = [
      edge('rel_901', 'seed_node', 'a_node', 'REPAIRS'),
      edge('rel_902', 'a_node', 'b_node', 'REPAIRS'),
    ];

    const result = propagate(bundleWith(edges), weak, [{ nodeId: 'seed_node', sign: 1 }], 70);

    // 1.0 * 0.2 = 0.2 passes; 0.2 * 0.2 = 0.04 does not.
    expect(result.nodes.get('a_node')).toBeDefined();
    expect(result.nodes.get('b_node')).toBeUndefined();
    expect(result.truncations.some((t) => t.reason === 'below_min_confidence')).toBe(true);
  });

  it('refuses a model that would let correlation propagate', () => {
    // The schema itself forbids it, so this can never be configured away at runtime.
    expect(() =>
      SimulationModelSchema.parse({
        ...b.simulationModel,
        propagating_causal_statuses: ['established_causal', 'correlational_only'],
      }),
    ).toThrow(/correlation must never propagate/i);
  });
});
