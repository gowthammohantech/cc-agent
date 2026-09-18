import type {
  AgeBand,
  BiologicalEntity,
  Hallmark,
  Observation,
  Population,
  Trajectory,
} from '@schemas/index';
import type { ContentBundle } from '@/content/bundle';
import { sampleTrajectory, type TrajectorySample } from './sample';

export interface AgeContext {
  age: number;
  populationId: string;
}

export interface AgeRange {
  age_min: number;
  age_max: number;
}

/**
 * FR-01's "expose missing data", returned alongside every result so the UI can
 * render absence as a designed state rather than an empty panel. A blank panel
 * reads as "nothing changes here"; a coverage report reads as "nobody has
 * curated this yet", and those are very different claims.
 */
export interface Coverage {
  observed: number;
  entitiesWithoutData: readonly string[];
  missingRanges: readonly AgeRange[];
}

export interface EntityState {
  entity: BiologicalEntity;
  observations: readonly Observation[];
  hallmarkIds: readonly string[];
}

export interface SystemState extends EntityState {
  descendantObservationCount: number;
}

export interface HallmarkState {
  hallmark: Hallmark;
  observations: readonly Observation[];
  band: AgeBand | null;
}

export interface AgeOverview {
  age: number;
  population: Population;
  band: AgeBand | null;
  bands: readonly AgeBand[];
  observations: readonly Observation[];
  coverage: Coverage;
}

function bandFor(bundle: ContentBundle, age: number): AgeBand | null {
  return bundle.ageBands.find((b) => age >= b.age_min && age <= b.age_max) ?? null;
}

function populationOf(bundle: ContentBundle, id: string): Population {
  const pop = bundle.populations.find((p) => p.id === id);
  if (!pop) {
    throw new Error(
      `Unknown population "${id}". Every value must carry population context (§15), so there is no default.`,
    );
  }
  return pop;
}

function observationsAt(bundle: ContentBundle, ctx: AgeContext): Observation[] {
  return bundle.ageIndex
    .observationsAt(ctx.age)
    .map((id) => bundle.indexes.observationById.get(id))
    .filter((o): o is Observation => o !== undefined)
    .filter((o) => o.population_id === ctx.populationId);
}

/** Contiguous integer ages in [0, 100] with no observation at all. */
function missingRanges(bundle: ContentBundle): AgeRange[] {
  const ranges: AgeRange[] = [];
  let start: number | null = null;
  for (let age = 0; age <= 100; age++) {
    const empty = bundle.ageIndex.observationsAt(age).length === 0;
    if (empty && start === null) start = age;
    if (!empty && start !== null) {
      ranges.push({ age_min: start, age_max: age - 1 });
      start = null;
    }
  }
  if (start !== null) ranges.push({ age_min: start, age_max: 100 });
  return ranges;
}

export function getAgeOverview(bundle: ContentBundle, ctx: AgeContext): AgeOverview {
  const observations = observationsAt(bundle, ctx);
  const withData = new Set(observations.map((o) => o.entity_id));

  return {
    age: ctx.age,
    population: populationOf(bundle, ctx.populationId),
    band: bandFor(bundle, ctx.age),
    bands: bundle.ageBands,
    observations,
    coverage: {
      observed: observations.length,
      entitiesWithoutData: bundle.entities
        .filter((e) => e.layer === 'L2_system')
        .filter((e) => {
          const covered = [e.id, ...(bundle.indexes.childrenOf.get(e.id) ?? [])];
          return !covered.some((id) => withData.has(id));
        })
        .map((e) => e.id),
      missingRanges: missingRanges(bundle),
    },
  };
}

/** Observations attached to an entity or anywhere beneath it in the hierarchy. */
function subtreeObservations(
  bundle: ContentBundle,
  rootId: string,
  atAge: readonly Observation[],
): Observation[] {
  const wanted = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === undefined) break;
    for (const child of bundle.indexes.childrenOf.get(id) ?? []) {
      if (!wanted.has(child)) {
        wanted.add(child);
        queue.push(child);
      }
    }
  }
  return atAge.filter((o) => wanted.has(o.entity_id));
}

export function getSystemsAtAge(bundle: ContentBundle, ctx: AgeContext): SystemState[] {
  const atAge = observationsAt(bundle, ctx);

  return bundle.entities
    .filter((e) => e.layer === 'L2_system')
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entity) => {
      const inSubtree = subtreeObservations(bundle, entity.id, atAge);
      return {
        entity,
        observations: inSubtree.filter((o) => o.entity_id === entity.id),
        hallmarkIds: entity.hallmark_ids,
        descendantObservationCount: inSubtree.length,
      };
    });
}

export function getHallmarksAtAge(bundle: ContentBundle, ctx: AgeContext): HallmarkState[] {
  const atAge = observationsAt(bundle, ctx);
  const band = bandFor(bundle, ctx.age);

  return [...bundle.hallmarks]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((hallmark) => ({
      hallmark,
      observations: atAge.filter((o) => o.hallmark_ids.includes(hallmark.id)),
      band,
    }));
}

export function getEntityAtAge(
  bundle: ContentBundle,
  ctx: AgeContext,
  entityId: string,
): EntityState | null {
  const entity = bundle.indexes.entityById.get(entityId);
  if (!entity) return null;
  return {
    entity,
    observations: observationsAt(bundle, ctx).filter((o) => o.entity_id === entityId),
    hallmarkIds: entity.hallmark_ids,
  };
}

export interface TrajectoryView {
  trajectory: Trajectory;
  sample: TrajectorySample;
}

export function getTrajectoriesForEntity(
  bundle: ContentBundle,
  entityId: string,
  ctx: AgeContext,
): TrajectoryView[] {
  return (bundle.indexes.trajectoriesByEntity.get(entityId) ?? [])
    .filter((t) => t.population_id === ctx.populationId)
    .map((trajectory) => ({ trajectory, sample: sampleTrajectory(trajectory, ctx.age) }));
}
