import { createHash } from 'node:crypto';
import type { SimulationInput } from '@schemas/index';
import { REJUVENATION_SCOPE_LABEL, RejuvenationScope } from '@schemas/index';
import type { ContentBundle } from '@/content/bundle';
import { nodeFor } from '@/domain/graph/graph';
import { propagate, type Seed } from './propagate';
import type { AffectedNode, NodeDirection, ScopeVerdict, SimulationOutput } from './types';

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function directionOf(sign: 1 | -1 | 0): NodeDirection {
  if (sign === 1) return 'toward_younger_reference';
  if (sign === -1) return 'toward_older_state';
  return 'indeterminate';
}

function confidenceBand(value: number): 'high' | 'moderate' | 'low' {
  if (value >= 0.6) return 'high';
  if (value >= 0.3) return 'moderate';
  return 'low';
}

/**
 * The scope summary exists to keep §49 in view at the moment a reader is most
 * likely to over-read a result. Every scope is listed, and whole_organism
 * always says the same thing, because no simulation over this corpus could
 * ever support it.
 */
function scopeSummary(affectedCount: number): ScopeVerdict[] {
  return RejuvenationScope.options.map((scope) => ({
    scope,
    statement:
      scope === 'whole_organism'
        ? 'Not supported. Nothing in this model bears on whole-organism age reversal, which requires durable multi-system human evidence.'
        : affectedCount > 0
          ? `This model traces direction only at this level; it does not establish ${REJUVENATION_SCOPE_LABEL[scope].toLowerCase()}.`
          : 'No curated causal path reaches this level from the selected modifications.',
  }));
}

export function runSimulation(bundle: ContentBundle, input: SimulationInput): SimulationOutput {
  const model = bundle.simulationModel;

  const seeds: Seed[] = input.modifications.map((m) => ({
    nodeId: m.target,
    sign: m.direction === 'reduce' ? -1 : 1,
  }));

  const result = propagate(bundle, model, seeds, input.chronological_age);
  const seedIds = new Set(seeds.map((s) => s.nodeId));

  const affected: AffectedNode[] = [...result.nodes.entries()]
    .filter(([id]) => !seedIds.has(id))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nodeId, state]) => ({
      node_id: nodeId,
      node_name: nodeFor(bundle, nodeId).name,
      direction: directionOf(state.sign),
      path: state.path,
      path_confidence: confidenceBand(state.confidence),
      weakest_link: state.weakestLink,
      conflicting_paths: state.conflicting,
    }));

  const confidence = Object.fromEntries(
    affected.map((node) => [
      node.node_id,
      node.direction === 'indeterminate'
        ? ('not_assessed' as const)
        : node.path_confidence === 'high'
          ? ('high' as const)
          : node.path_confidence === 'moderate'
            ? ('moderate' as const)
            : ('low' as const),
    ]),
  );

  const output: SimulationOutput = {
    run_id: '',
    model_version: model.model_version,
    content_version: bundle.contentVersion,
    input_echo: {
      chronological_age: input.chronological_age,
      reference_age: input.reference_age,
      population_id: input.population_id,
      modifications: input.modifications,
    },
    affected_nodes: affected,
    unsupported_relationships: result.blocked,
    truncations: result.truncations,
    confidence,
    scope_summary: scopeSummary(affected.length),
    whole_organism_claim: 'not_supported',
    disclaimer: model.disclaimer,
    bounds_description: model.bounds_description,
    not_a_clinical_prediction: true,
  };

  // Deterministic id over the input, the model and the content version: the
  // same question against the same corpus always yields the same run.
  return {
    ...output,
    run_id: createHash('sha256')
      .update(`${canonicalJson(input)}|${model.model_version}|${bundle.contentVersion}`, 'utf8')
      .digest('hex')
      .slice(0, 16),
  };
}
