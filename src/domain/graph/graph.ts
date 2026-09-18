import type { CausalStatus, EvidenceLevel, Relationship, RelationshipType } from '@schemas/index';
import { EVIDENCE_LEVEL_ORDER } from '@schemas/index';
import type { ContentBundle } from '@/content/bundle';

export type NodeKind = 'entity' | 'hallmark' | 'approach' | 'target' | 'unknown';

export interface GraphNode {
  id: string;
  kind: NodeKind;
  name: string;
  description: string;
}

export interface Subgraph {
  nodes: readonly GraphNode[];
  edges: readonly Relationship[];
  /** Nodes reached at the depth limit, whose own neighbours were not explored. */
  truncatedAt: readonly string[];
}

export interface EdgeFilter {
  minEvidence?: EvidenceLevel;
  causalStatuses?: readonly CausalStatus[];
  relationshipTypes?: readonly RelationshipType[];
  atAge?: number;
}

export function nodeFor(bundle: ContentBundle, id: string): GraphNode {
  const entity = bundle.indexes.entityById.get(id);
  if (entity) {
    return { id, kind: 'entity', name: entity.name, description: entity.description };
  }
  const hallmark = bundle.indexes.hallmarkById.get(id);
  if (hallmark) {
    return { id, kind: 'hallmark', name: hallmark.name, description: hallmark.description };
  }
  const approach = bundle.indexes.approachById.get(id);
  if (approach) {
    return { id, kind: 'approach', name: approach.name, description: approach.description };
  }
  const target = bundle.indexes.targetById.get(id);
  if (target) {
    return { id, kind: 'target', name: target.name, description: target.desired_direction };
  }
  return { id, kind: 'unknown', name: id, description: '' };
}

export function passesFilter(edge: Relationship, filter: EdgeFilter | undefined): boolean {
  if (!filter) return true;

  if (filter.minEvidence) {
    const limit = EVIDENCE_LEVEL_ORDER.indexOf(filter.minEvidence);
    if (EVIDENCE_LEVEL_ORDER.indexOf(edge.provenance.evidence_level) > limit) return false;
  }
  if (filter.causalStatuses && !filter.causalStatuses.includes(edge.provenance.causal_status)) {
    return false;
  }
  if (filter.relationshipTypes && !filter.relationshipTypes.includes(edge.relationship)) {
    return false;
  }
  if (filter.atAge !== undefined && edge.age_context !== null) {
    if (filter.atAge < edge.age_context.age_min || filter.atAge > edge.age_context.age_max) {
      return false;
    }
  }
  return true;
}

export function neighbors(
  bundle: ContentBundle,
  id: string,
  direction: 'in' | 'out' | 'both',
  filter?: EdgeFilter,
): Relationship[] {
  const out = direction !== 'in' ? (bundle.indexes.outgoing.get(id) ?? []) : [];
  const inc = direction !== 'out' ? (bundle.indexes.incoming.get(id) ?? []) : [];
  const seen = new Set<string>();

  return [...out, ...inc]
    .filter((e) => {
      if (seen.has(e.relationship_id)) return false;
      seen.add(e.relationship_id);
      return passesFilter(e, filter);
    })
    .sort((a, b) => a.relationship_id.localeCompare(b.relationship_id));
}

/**
 * Bounded breadth-first walk. Edge iteration is sorted by relationship id and
 * the visited set is explicit, so output is byte-stable across runs — which is
 * what makes these subgraphs safe to snapshot-test.
 */
function walk(
  bundle: ContentBundle,
  startId: string,
  depth: number,
  direction: 'in' | 'out',
  filter?: EdgeFilter,
): Subgraph {
  const nodeIds = new Set<string>([startId]);
  const edges = new Map<string, Relationship>();
  const truncatedAt: string[] = [];

  let frontier = [startId];
  for (let level = 0; level < depth; level++) {
    const next: string[] = [];

    for (const id of frontier) {
      const adjacent = (
        direction === 'out'
          ? (bundle.indexes.outgoing.get(id) ?? [])
          : (bundle.indexes.incoming.get(id) ?? [])
      )
        .filter((e) => passesFilter(e, filter))
        .sort((a, b) => a.relationship_id.localeCompare(b.relationship_id));

      for (const edge of adjacent) {
        edges.set(edge.relationship_id, edge);
        const other = direction === 'out' ? edge.to_node : edge.from_node;
        if (!nodeIds.has(other)) {
          nodeIds.add(other);
          next.push(other);
        }
      }
    }

    frontier = next;
    if (frontier.length === 0) break;
    if (level === depth - 1) truncatedAt.push(...frontier);
  }

  return {
    nodes: [...nodeIds].sort().map((id) => nodeFor(bundle, id)),
    edges: [...edges.values()].sort((a, b) => a.relationship_id.localeCompare(b.relationship_id)),
    truncatedAt: truncatedAt.sort(),
  };
}

/** P6's "why is this happening?" — what feeds into this node. */
export function upstreamOf(
  bundle: ContentBundle,
  id: string,
  depth = 2,
  filter?: EdgeFilter,
): Subgraph {
  return walk(bundle, id, depth, 'in', filter);
}

/** What this node feeds into. */
export function downstreamOf(
  bundle: ContentBundle,
  id: string,
  depth = 2,
  filter?: EdgeFilter,
): Subgraph {
  return walk(bundle, id, depth, 'out', filter);
}

/** P9's network view around one hallmark, in both directions. */
export function subgraphAround(
  bundle: ContentBundle,
  id: string,
  depth = 1,
  filter?: EdgeFilter,
): Subgraph {
  const up = upstreamOf(bundle, id, depth, filter);
  const down = downstreamOf(bundle, id, depth, filter);

  const nodes = new Map<string, GraphNode>();
  for (const n of [...up.nodes, ...down.nodes]) nodes.set(n.id, n);
  const edges = new Map<string, Relationship>();
  for (const e of [...up.edges, ...down.edges]) edges.set(e.relationship_id, e);

  return {
    nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...edges.values()].sort((a, b) => a.relationship_id.localeCompare(b.relationship_id)),
    truncatedAt: [...new Set([...up.truncatedAt, ...down.truncatedAt])].sort(),
  };
}

export function wholeGraph(bundle: ContentBundle, filter?: EdgeFilter): Subgraph {
  const edges = bundle.relationships
    .filter((e) => passesFilter(e, filter))
    .sort((a, b) => a.relationship_id.localeCompare(b.relationship_id));
  const nodeIds = new Set(edges.flatMap((e) => [e.from_node, e.to_node]));

  return {
    nodes: [...nodeIds].sort().map((id) => nodeFor(bundle, id)),
    edges,
    truncatedAt: [],
  };
}
