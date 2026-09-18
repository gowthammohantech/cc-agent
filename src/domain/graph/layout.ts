import type { Subgraph } from './graph';

export interface LaidOutNode {
  id: string;
  name: string;
  kind: string;
  x: number;
  y: number;
  layer: number;
}

export interface GraphLayout {
  nodes: readonly LaidOutNode[];
  width: number;
  height: number;
}

/**
 * A deterministic layered layout, computed by distance from the focus node.
 *
 * Force-directed layout was the obvious choice and is the wrong one here: it is
 * non-deterministic, so the same subgraph would look different on every visit
 * and could not be snapshot-tested. A causal diagram that rearranges itself
 * between readings is harder to reason about, not easier.
 */
export function layoutSubgraph(
  subgraph: Subgraph,
  focusId: string,
  direction: 'in' | 'out',
): GraphLayout {
  const depth = new Map<string, number>([[focusId, 0]]);
  let frontier = [focusId];

  for (let d = 1; d <= 6 && frontier.length > 0; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const edge of subgraph.edges) {
        const [from, to] =
          direction === 'in' ? [edge.to_node, edge.from_node] : [edge.from_node, edge.to_node];
        if (from === id && !depth.has(to)) {
          depth.set(to, d);
          next.push(to);
        }
      }
    }
    frontier = next;
  }

  const byLayer = new Map<number, string[]>();
  for (const node of subgraph.nodes) {
    const d = depth.get(node.id) ?? 1;
    const bucket = byLayer.get(d);
    if (bucket) bucket.push(node.id);
    else byLayer.set(d, [node.id]);
  }
  for (const ids of byLayer.values()) ids.sort();

  const LAYER_HEIGHT = 130;
  const NODE_SPACING = 210;
  const maxPerLayer = Math.max(...[...byLayer.values()].map((v) => v.length), 1);
  const width = Math.max(maxPerLayer * NODE_SPACING, 520);
  const layers = Math.max(...byLayer.keys(), 0) + 1;

  const nodes: LaidOutNode[] = [];
  for (const [layer, ids] of [...byLayer.entries()].sort((a, b) => a[0] - b[0])) {
    ids.forEach((id, i) => {
      const node = subgraph.nodes.find((n) => n.id === id);
      if (!node) return;
      const span = width / (ids.length + 1);
      nodes.push({
        id,
        name: node.name,
        kind: node.kind,
        x: span * (i + 1),
        // `in` reads bottom-up: causes below, effect above, matching how the
        // question "why is this happening?" is asked.
        y: direction === 'in' ? (layers - layer) * LAYER_HEIGHT : (layer + 1) * LAYER_HEIGHT,
        layer,
      });
    });
  }

  return { nodes, width, height: (layers + 1) * LAYER_HEIGHT };
}
