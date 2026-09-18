import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import { upstreamOf, downstreamOf } from '@/domain/graph/graph';
import { layoutSubgraph } from '@/domain/graph/layout';

const b = getBundle();

describe('graph layout', () => {
  it('is deterministic — the same subgraph lays out identically every time', () => {
    // Force-directed layout was the obvious choice and the wrong one: a causal
    // diagram that rearranges itself between readings is harder to reason
    // about, and cannot be snapshot-tested at all.
    const sub = upstreamOf(b, 'chronic_inflammation', 3);
    const a = layoutSubgraph(sub, 'chronic_inflammation', 'in');
    const c = layoutSubgraph(sub, 'chronic_inflammation', 'in');
    expect(JSON.stringify(a)).toBe(JSON.stringify(c));
  });

  it('places the focus node in its own layer', () => {
    const sub = upstreamOf(b, 'cellular_senescence', 2);
    const layout = layoutSubgraph(sub, 'cellular_senescence', 'in');
    const focus = layout.nodes.find((n) => n.id === 'cellular_senescence');
    expect(focus?.layer).toBe(0);
  });

  it('orders upstream causes below the effect, so "why" reads bottom-up', () => {
    const sub = upstreamOf(b, 'chronic_inflammation', 2);
    const layout = layoutSubgraph(sub, 'chronic_inflammation', 'in');
    const focus = layout.nodes.find((n) => n.id === 'chronic_inflammation');
    const causes = layout.nodes.filter((n) => n.layer > 0);
    for (const cause of causes) {
      expect(cause.y, `${cause.id} should sit below the effect`).toBeLessThan(focus?.y ?? 0);
    }
  });

  it('gives every node in the subgraph a position', () => {
    const sub = downstreamOf(b, 'cellular_senescence', 3);
    const layout = layoutSubgraph(sub, 'cellular_senescence', 'out');
    expect(layout.nodes).toHaveLength(sub.nodes.length);
    expect(layout.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
  });

  it('never overlaps two nodes in the same layer', () => {
    const sub = downstreamOf(b, 'genomic_instability', 3);
    const layout = layoutSubgraph(sub, 'genomic_instability', 'out');
    const byLayer = new Map<number, number[]>();
    for (const n of layout.nodes) {
      const xs = byLayer.get(n.layer) ?? [];
      xs.push(n.x);
      byLayer.set(n.layer, xs);
    }
    for (const xs of byLayer.values()) {
      expect(new Set(xs).size, 'two nodes share an x within one layer').toBe(xs.length);
    }
  });

  it('produces a canvas large enough for its widest layer', () => {
    const sub = downstreamOf(b, 'cellular_senescence', 3);
    const layout = layoutSubgraph(sub, 'cellular_senescence', 'out');
    expect(layout.width).toBeGreaterThanOrEqual(520);
    expect(layout.height).toBeGreaterThan(0);
    expect(layout.nodes.every((n) => n.x > 0 && n.x < layout.width)).toBe(true);
  });
});
