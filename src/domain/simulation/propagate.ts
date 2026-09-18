import type { Relationship, SimulationModel } from '@schemas/index';
import { CAUSAL_STATUS_LABEL, RELATIONSHIP_LABEL } from '@schemas/index';
import type { ContentBundle } from '@/content/bundle';
import type { BlockedEdge, BlockedReason, PathSummary, Truncation } from './types';

export interface Seed {
  nodeId: string;
  sign: 1 | -1;
}

interface NodeState {
  sign: 1 | -1 | 0;
  confidence: number;
  path: PathSummary;
  weakestLink: { relationship_id: string; reason: string } | null;
  conflicting: PathSummary[];
}

export interface PropagationResult {
  nodes: ReadonlyMap<string, NodeState>;
  blocked: readonly BlockedEdge[];
  truncations: readonly Truncation[];
}

function blockReasonFor(
  edge: Relationship,
  model: SimulationModel,
  age: number,
): BlockedReason | null {
  const semantics = model.edge_semantics[edge.relationship];

  // §6 Principle 4, made operational. A correlation can never become a
  // simulated consequence, no matter how strong the evidence behind it is.
  if (!semantics?.propagates) return 'relationship_type_not_causal';

  if (!model.propagating_causal_statuses.includes(edge.provenance.causal_status)) {
    switch (edge.provenance.causal_status) {
      case 'correlational_only':
        return 'causal_status_correlational_only';
      case 'disputed':
        return 'causal_status_disputed';
      case 'proposed':
        return 'causal_status_proposed';
      default:
        return 'causal_status_unknown';
    }
  }

  if (!model.propagating_review_statuses.includes(edge.provenance.review_status)) {
    return 'not_reviewed';
  }

  if (edge.age_context && (age < edge.age_context.age_min || age > edge.age_context.age_max)) {
    return 'outside_age_context';
  }

  return null;
}

const BLOCK_EXPLANATION: Record<BlockedReason, string> = {
  relationship_type_not_causal:
    'This link records an association, not a mechanism, so nothing is carried across it.',
  causal_status_correlational_only:
    'This link is correlational only. Two things moving together does not mean changing one changes the other.',
  causal_status_disputed: 'Sources conflict on this link, so the model does not traverse it.',
  causal_status_proposed:
    'This link is a proposed explanation rather than a supported mechanism, so the model stops here.',
  causal_status_unknown: 'The causal standing of this link is unknown, so the model stops here.',
  not_reviewed: 'This link has not reached a review status the model will propagate through.',
  outside_age_context:
    'This link is only documented within an age range that excludes the selected age.',
};

/**
 * Bounded signed breadth-first propagation.
 *
 * Three properties matter more than the traversal itself:
 *
 * 1. Blocked edges are collected and returned, never silently skipped. Where
 *    the model stops is the most honest thing it can tell a reader, so it is
 *    output rather than an omission.
 * 2. Conflicting paths set the node to indeterminate and BOTH paths are kept.
 *    Averaging opposing evidence into a net direction would manufacture a
 *    conclusion the evidence does not contain.
 * 3. Confidence decays multiplicatively with a floor, so long speculative
 *    chains terminate and are reported as truncations rather than quietly
 *    shortened.
 *
 * Determinism: no randomness, no clock, and every iteration is over a sorted
 * list — the same input yields byte-identical output.
 */
export function propagate(
  bundle: ContentBundle,
  model: SimulationModel,
  seeds: readonly Seed[],
  age: number,
): PropagationResult {
  const nodes = new Map<string, NodeState>();
  const blocked = new Map<string, BlockedEdge>();
  const truncations: Truncation[] = [];

  for (const seed of [...seeds].sort((a, b) => a.nodeId.localeCompare(b.nodeId))) {
    nodes.set(seed.nodeId, {
      sign: seed.sign,
      confidence: 1,
      path: { edges: [], depth: 0 },
      weakestLink: null,
      conflicting: [],
    });
  }

  let frontier = [...nodes.keys()].sort();
  let iterations = 0;

  for (let depth = 0; depth < model.max_depth && frontier.length > 0; depth++) {
    const next: string[] = [];

    for (const nodeId of frontier) {
      const current = nodes.get(nodeId);
      if (!current || current.sign === 0) continue;

      const outgoing = [...(bundle.indexes.outgoing.get(nodeId) ?? [])]
        .filter((e) => e.from_node === nodeId)
        .sort((a, b) => a.relationship_id.localeCompare(b.relationship_id));

      for (const edge of outgoing) {
        if (++iterations > model.max_iterations) break;

        const reason = blockReasonFor(edge, model, age);
        if (reason !== null) {
          blocked.set(edge.relationship_id, {
            relationship_id: edge.relationship_id,
            from_node: edge.from_node,
            to_node: edge.to_node,
            reason,
            explanation: BLOCK_EXPLANATION[reason],
          });
          continue;
        }

        const multiplier = model.confidence_multipliers[edge.provenance.confidence] ?? 0;
        const confidence = current.confidence * multiplier;
        if (confidence < model.min_confidence) {
          truncations.push({
            node_id: edge.to_node,
            reason: 'below_min_confidence',
            explanation: `The chain reaching this point is too uncertain to follow further (${CAUSAL_STATUS_LABEL[edge.provenance.causal_status].toLowerCase()}, ${edge.provenance.confidence.replace('_', ' ')} confidence).`,
          });
          continue;
        }

        const semantics = model.edge_semantics[edge.relationship];
        const edgeSign = semantics?.sign ?? 0;
        if (edgeSign === 0) continue;

        const sign = (current.sign * edgeSign) as 1 | -1;
        const path: PathSummary = {
          edges: [...current.path.edges, edge.relationship_id],
          depth: current.path.depth + 1,
        };
        const weakest =
          multiplier <= (current.weakestLink ? multiplier : 1)
            ? {
                relationship_id: edge.relationship_id,
                reason: `${RELATIONSHIP_LABEL[edge.relationship]} — ${edge.provenance.confidence.replace('_', ' ')} confidence`,
              }
            : current.weakestLink;

        const existing = nodes.get(edge.to_node);

        if (!existing) {
          nodes.set(edge.to_node, {
            sign,
            confidence,
            path,
            weakestLink: weakest,
            conflicting: [],
          });
          next.push(edge.to_node);
          continue;
        }

        if (existing.sign === 0) {
          // Already indeterminate: record the path and stop propagating from it.
          existing.conflicting = [...existing.conflicting, path];
          continue;
        }

        if (existing.sign === sign) {
          if (confidence > existing.confidence) {
            existing.confidence = confidence;
            existing.path = path;
            existing.weakestLink = weakest;
          }
          continue;
        }

        // Opposing evidence. Keep both accounts and refuse to pick one.
        existing.sign = 0;
        existing.conflicting = [existing.path, path];
      }
    }

    frontier = [...new Set(next)].sort();
  }

  for (const nodeId of frontier) {
    truncations.push({
      node_id: nodeId,
      reason: 'max_depth',
      explanation: `The model follows at most ${model.max_depth} steps, and stopped here rather than reasoning further.`,
    });
  }

  return {
    nodes,
    blocked: [...blocked.values()].sort((a, b) =>
      a.relationship_id.localeCompare(b.relationship_id),
    ),
    truncations: truncations.sort(
      (a, b) => a.node_id.localeCompare(b.node_id) || a.reason.localeCompare(b.reason),
    ),
  };
}
