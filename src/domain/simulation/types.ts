import type { Confidence, RejuvenationScope } from '@schemas/index';

/**
 * FR-08 output.
 *
 * Read the shape before the algorithm: there is no magnitude, no percentage,
 * no score and no age field anywhere in this type. `direction` is a four-value
 * enum and `whole_organism_claim` is a literal type with exactly one permitted
 * value. A personal age assertion of the kind §21 prohibits has no field here
 * to be built from, which is a stronger guarantee than any amount of output
 * filtering — and note that the prohibited-claim scanner flags this very
 * comment if it quotes such a sentence, so it is described rather than shown.
 */
export type NodeDirection =
  'toward_younger_reference' | 'toward_older_state' | 'indeterminate' | 'unsupported';

export interface PathSummary {
  edges: readonly string[];
  depth: number;
}

export interface AffectedNode {
  node_id: string;
  node_name: string;
  direction: NodeDirection;
  path: PathSummary;
  path_confidence: 'high' | 'moderate' | 'low';
  /** The least certain link in the chain — where the reasoning is thinnest. */
  weakest_link: { relationship_id: string; reason: string } | null;
  /** Both paths are retained when evidence conflicts; neither is discarded. */
  conflicting_paths: readonly PathSummary[];
}

export type BlockedReason =
  | 'relationship_type_not_causal'
  | 'causal_status_correlational_only'
  | 'causal_status_disputed'
  | 'causal_status_proposed'
  | 'causal_status_unknown'
  | 'not_reviewed'
  | 'outside_age_context';

export interface BlockedEdge {
  relationship_id: string;
  from_node: string;
  to_node: string;
  reason: BlockedReason;
  explanation: string;
}

export interface Truncation {
  node_id: string;
  reason: 'max_depth' | 'below_min_confidence';
  explanation: string;
}

export interface ScopeVerdict {
  scope: RejuvenationScope;
  statement: string;
}

export interface SimulationOutput {
  run_id: string;
  model_version: string;
  content_version: string;
  input_echo: {
    chronological_age: number;
    reference_age: number;
    population_id: string;
    modifications: ReadonlyArray<{ target: string; direction: string }>;
  };
  affected_nodes: readonly AffectedNode[];
  /** Edges the model refused to traverse, reported rather than dropped. */
  unsupported_relationships: readonly BlockedEdge[];
  truncations: readonly Truncation[];
  confidence: Readonly<Record<string, Confidence>>;
  scope_summary: readonly ScopeVerdict[];
  /** Literal type: this can never be anything else. */
  whole_organism_claim: 'not_supported';
  disclaimer: string;
  bounds_description: string;
  not_a_clinical_prediction: true;
}
