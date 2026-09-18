import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import {
  downstreamOf,
  neighbors,
  nodeFor,
  passesFilter,
  subgraphAround,
  upstreamOf,
  wholeGraph,
} from '@/domain/graph/graph';
import { CAUSAL_EDGE_STYLE } from '@/domain/graph/edgeSemantics';
import { CausalStatus } from '@schemas/index';

const b = getBundle();

describe('knowledge graph (FR-05)', () => {
  it('walks upstream to answer "why is this happening?"', () => {
    const sub = upstreamOf(b, 'chronic_inflammation', 2);
    expect(sub.edges.length).toBeGreaterThan(0);
    expect(sub.nodes.some((n) => n.id === 'chronic_inflammation')).toBe(true);
  });

  it('walks downstream to show consequences', () => {
    const sub = downstreamOf(b, 'cellular_senescence', 2);
    expect(sub.edges.length).toBeGreaterThan(0);
  });

  it('produces byte-stable output across runs, so subgraphs can be snapshotted', () => {
    const a = upstreamOf(b, 'chronic_inflammation', 3);
    const c = upstreamOf(b, 'chronic_inflammation', 3);
    expect(JSON.stringify(a)).toBe(JSON.stringify(c));
    expect([...a.edges].map((e) => e.relationship_id)).toEqual(
      [...a.edges].map((e) => e.relationship_id).sort(),
    );
  });

  it('respects the depth limit and reports where it stopped', () => {
    const shallow = downstreamOf(b, 'genomic_instability', 1);
    const deep = downstreamOf(b, 'genomic_instability', 4);
    expect(deep.edges.length).toBeGreaterThanOrEqual(shallow.edges.length);
    expect(Array.isArray(shallow.truncatedAt)).toBe(true);
  });

  it('terminates on a cyclic path rather than looping', () => {
    // A generous depth over the whole corpus must still return.
    expect(() => subgraphAround(b, 'cellular_senescence', 6)).not.toThrow();
  });

  it('filters by causal status', () => {
    const onlyEstablished = wholeGraph(b, { causalStatuses: ['established_causal'] });
    expect(
      onlyEstablished.edges.every((e) => e.provenance.causal_status === 'established_causal'),
    ).toBe(true);
    expect(onlyEstablished.edges.length).toBeLessThan(b.relationships.length);
  });

  it('filters by minimum evidence level using the §20 ordering', () => {
    const humanOnly = wholeGraph(b, { minEvidence: 'human_observational' });
    expect(
      humanOnly.edges.every((e) =>
        ['human_established', 'human_clinical', 'human_observational'].includes(
          e.provenance.evidence_level,
        ),
      ),
    ).toBe(true);
  });

  it('applies an edge age context when one is declared', () => {
    const edge = b.relationships[0]!;
    const scoped = { ...edge, age_context: { age_min: 40, age_max: 60 } };
    expect(passesFilter(scoped, { atAge: 50 })).toBe(true);
    expect(passesFilter(scoped, { atAge: 20 })).toBe(false);
    expect(passesFilter(edge, { atAge: 20 })).toBe(true); // null context is unrestricted
  });

  it('de-duplicates when asked for neighbours in both directions', () => {
    const both = neighbors(b, 'cellular_senescence', 'both');
    expect(new Set(both.map((e) => e.relationship_id)).size).toBe(both.length);
  });

  it('labels a node by what it actually is', () => {
    expect(nodeFor(b, 'cellular_senescence').kind).toBe('hallmark');
    expect(nodeFor(b, 'skeletal_muscle').kind).toBe('entity');
    expect(nodeFor(b, 'senolytics').kind).toBe('approach');
    expect(nodeFor(b, 'nothing_here').kind).toBe('unknown');
  });
});

describe('edge display semantics (§46)', () => {
  it('distinguishes every causal status without relying on colour', () => {
    const styles = CausalStatus.options.map((s) => CAUSAL_EDGE_STYLE[s]);
    // Each status must be tellable apart by dash pattern, marker or text.
    const signatures = styles.map((s) => `${s.dashArray ?? 'solid'}|${s.marker}`);
    expect(new Set(signatures).size).toBe(CausalStatus.options.length);
    expect(styles.every((s) => s.textPrefix.length > 0)).toBe(true);
  });

  it('says "correlation only" in words, not just in line style', () => {
    expect(CAUSAL_EDGE_STYLE.correlational_only.textPrefix.toLowerCase()).toContain('correlation');
  });
});
