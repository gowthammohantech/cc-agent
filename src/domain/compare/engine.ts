import type { Direction, Observation, Population, Provenance } from '@schemas/index';
import type { ContentBundle } from '@/content/bundle';
import { sampleTrajectory } from '@/domain/timeline/sample';

export interface CompareInput {
  ageA: number;
  ageB: number;
  /** Entity ids. Empty means "every organ system". */
  dimensions: readonly string[];
  populationId: string;
}

export type NoComparableReason =
  | 'no_data_at_age_a'
  | 'no_data_at_age_b'
  | 'no_data_at_either_age'
  | 'different_measures'
  | 'different_populations'
  | 'not_quantified_in_source';

export const NO_COMPARABLE_REASON_TEXT: Readonly<Record<NoComparableReason, string>> = {
  no_data_at_age_a: 'No curated data at the first age.',
  no_data_at_age_b: 'No curated data at the second age.',
  no_data_at_either_age: 'No curated data at either age.',
  different_measures:
    'The two ages are documented using different measures, which are not comparable.',
  different_populations:
    'The two ages are documented in different populations, which are not comparable.',
  not_quantified_in_source:
    'The sources describe this difference without reporting a comparable number.',
};

export type CompareCell =
  | {
      kind: 'qualitative';
      direction: Direction;
      statement: string;
      provenance: Provenance;
    }
  | {
      kind: 'quantitative';
      measure: string;
      unit: string;
      a: number;
      b: number;
      delta: number;
      provenance: Provenance;
    }
  | {
      kind: 'no_comparable_data';
      reason: NoComparableReason;
      /** Whatever is known at one age, even when a comparison is impossible. */
      partial: readonly Observation[];
    };

export interface CompareRow {
  entityId: string;
  entityName: string;
  cell: CompareCell;
}

export interface CompareResult {
  ageA: number;
  ageB: number;
  population: Population;
  rows: readonly CompareRow[];
}

function observationsFor(
  bundle: ContentBundle,
  entityId: string,
  age: number,
  populationId: string,
): Observation[] {
  return bundle.ageIndex
    .observationsAt(age)
    .map((id) => bundle.indexes.observationById.get(id))
    .filter((o): o is Observation => o !== undefined)
    .filter((o) => o.entity_id === entityId && o.population_id === populationId)
    .sort((a, b) => a.observation_id.localeCompare(b.observation_id));
}

/**
 * FR-06.
 *
 * A quantitative cell is produced only when both ages yield a `supported`
 * sample on the same measure, the same unit and the same population. Every
 * other situation degrades to `no_comparable_data` carrying the specific
 * reason, which the UI shows to the reader.
 *
 * The engine never subtracts across populations or across measures. A number
 * that looks like a comparison but is not one is worse than a stated gap,
 * because it travels — into screenshots, into arguments, into someone's slide.
 */
export function compareAges(bundle: ContentBundle, input: CompareInput): CompareResult {
  const population = bundle.populations.find((p) => p.id === input.populationId);
  if (!population) throw new Error(`Unknown population "${input.populationId}"`);

  const dimensionIds =
    input.dimensions.length > 0
      ? input.dimensions
      : bundle.entities
          .filter((e) => e.layer === 'L2_system')
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((e) => e.id);

  const rows = dimensionIds.map((entityId): CompareRow => {
    const entity = bundle.indexes.entityById.get(entityId);
    const name = entity?.name ?? entityId;

    const quantitative = compareQuantitative(bundle, entityId, input);
    if (quantitative) return { entityId, entityName: name, cell: quantitative };

    const atA = observationsFor(bundle, entityId, input.ageA, input.populationId);
    const atB = observationsFor(bundle, entityId, input.ageB, input.populationId);

    if (atA.length === 0 && atB.length === 0) {
      return {
        entityId,
        entityName: name,
        cell: { kind: 'no_comparable_data', reason: 'no_data_at_either_age', partial: [] },
      };
    }
    if (atB.length === 0) {
      return {
        entityId,
        entityName: name,
        cell: { kind: 'no_comparable_data', reason: 'no_data_at_age_b', partial: atA },
      };
    }
    if (atA.length === 0) {
      // The usual shape: a change documented in later life with no counterpart
      // record at the younger age. Report what exists at B rather than nothing.
      const describing = atB.find((o) => o.effect.kind !== 'not_quantified') ?? atB[0];
      if (describing && describing.effect.kind === 'qualitative') {
        return {
          entityId,
          entityName: name,
          cell: {
            kind: 'qualitative',
            direction: describing.effect.direction,
            statement: describing.effect.statement,
            provenance: describing.provenance,
          },
        };
      }
      return {
        entityId,
        entityName: name,
        cell: { kind: 'no_comparable_data', reason: 'no_data_at_age_a', partial: atB },
      };
    }

    const qualitative = atB.find((o) => o.effect.kind === 'qualitative');
    if (qualitative && qualitative.effect.kind === 'qualitative') {
      return {
        entityId,
        entityName: name,
        cell: {
          kind: 'qualitative',
          direction: qualitative.effect.direction,
          statement: qualitative.effect.statement,
          provenance: qualitative.provenance,
        },
      };
    }

    return {
      entityId,
      entityName: name,
      cell: {
        kind: 'no_comparable_data',
        reason: 'not_quantified_in_source',
        partial: [...atA, ...atB],
      },
    };
  });

  return { ageA: input.ageA, ageB: input.ageB, population, rows };
}

function compareQuantitative(
  bundle: ContentBundle,
  entityId: string,
  input: CompareInput,
): CompareCell | null {
  const trajectories = (bundle.indexes.trajectoriesByEntity.get(entityId) ?? []).filter(
    (t) => t.population_id === input.populationId,
  );

  for (const t of trajectories) {
    const a = sampleTrajectory(t, input.ageA);
    const b = sampleTrajectory(t, input.ageB);
    // Only two measured points make a comparison. An interpolated value is a
    // drawn line, not a measurement, and must not be subtracted.
    if (a.status === 'supported' && b.status === 'supported') {
      return {
        kind: 'quantitative',
        measure: t.measure,
        unit: t.unit ?? '',
        a: a.value,
        b: b.value,
        delta: b.value - a.value,
        provenance: t.provenance,
      };
    }
  }
  return null;
}
