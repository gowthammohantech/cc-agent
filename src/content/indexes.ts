import type {
  BiologicalEntity,
  EntityLayer,
  Hallmark,
  Observation,
  Relationship,
  Study,
  EvidenceProfile,
  ResearchApproach,
  RejuvenationTarget,
  Trajectory,
} from '@schemas/index';
import type { RawContent } from './load';

/**
 * Derived lookup structures, built once from the parsed corpus.
 *
 * Everything here is sorted by a stable key so that traversal output is
 * deterministic and therefore snapshot-testable — non-determinism in a
 * scientific view is a correctness problem, not a cosmetic one.
 */
export interface ContentIndexes {
  entityById: ReadonlyMap<string, BiologicalEntity>;
  childrenOf: ReadonlyMap<string, readonly string[]>;
  ancestorsOf: ReadonlyMap<string, readonly string[]>;
  depthOf: ReadonlyMap<string, number>;
  entitiesByLayer: ReadonlyMap<EntityLayer, readonly string[]>;

  hallmarkById: ReadonlyMap<string, Hallmark>;
  studyById: ReadonlyMap<string, Study>;
  profileById: ReadonlyMap<string, EvidenceProfile>;
  approachById: ReadonlyMap<string, ResearchApproach>;
  targetById: ReadonlyMap<string, RejuvenationTarget>;

  observationById: ReadonlyMap<string, Observation>;
  observationsByEntity: ReadonlyMap<string, readonly string[]>;
  observationsByHallmark: ReadonlyMap<string, readonly string[]>;
  trajectoriesByEntity: ReadonlyMap<string, readonly Trajectory[]>;

  relationshipById: ReadonlyMap<string, Relationship>;
  outgoing: ReadonlyMap<string, readonly Relationship[]>;
  incoming: ReadonlyMap<string, readonly Relationship[]>;

  /** Every id a graph edge or reference is permitted to point at. */
  knownNodeIds: ReadonlySet<string>;
}

function pushTo<T>(map: Map<string, T[]>, key: string, value: T): void {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}

export function buildIndexes(content: RawContent): ContentIndexes {
  const entityById = new Map(content.entities.map((e) => [e.id, e]));

  const childrenMap = new Map<string, string[]>();
  for (const e of [...content.entities].sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.parent_id !== null) pushTo(childrenMap, e.parent_id, e.id);
  }

  const ancestorsOf = new Map<string, readonly string[]>();
  const depthOf = new Map<string, number>();
  function ancestors(id: string, seen: ReadonlySet<string> = new Set()): readonly string[] {
    const cached = ancestorsOf.get(id);
    if (cached) return cached;
    const entity = entityById.get(id);
    if (!entity || entity.parent_id === null || seen.has(id)) {
      ancestorsOf.set(id, []);
      depthOf.set(id, 0);
      return [];
    }
    const chain = [...ancestors(entity.parent_id, new Set([...seen, id])), entity.parent_id];
    ancestorsOf.set(id, chain);
    depthOf.set(id, chain.length);
    return chain;
  }
  for (const e of content.entities) ancestors(e.id);

  const entitiesByLayer = new Map<EntityLayer, string[]>();
  for (const e of [...content.entities].sort((a, b) => a.name.localeCompare(b.name))) {
    const existing = entitiesByLayer.get(e.layer);
    if (existing) existing.push(e.id);
    else entitiesByLayer.set(e.layer, [e.id]);
  }

  const observationsByEntity = new Map<string, string[]>();
  const observationsByHallmark = new Map<string, string[]>();
  for (const o of [...content.observations].sort((a, b) =>
    a.observation_id.localeCompare(b.observation_id),
  )) {
    pushTo(observationsByEntity, o.entity_id, o.observation_id);
    for (const h of o.hallmark_ids) pushTo(observationsByHallmark, h, o.observation_id);
  }

  const trajectoriesByEntity = new Map<string, Trajectory[]>();
  for (const t of [...content.trajectories].sort((a, b) =>
    a.trajectory_id.localeCompare(b.trajectory_id),
  )) {
    pushTo(trajectoriesByEntity, t.entity_id, t);
  }

  const outgoing = new Map<string, Relationship[]>();
  const incoming = new Map<string, Relationship[]>();
  for (const r of [...content.relationships].sort((a, b) =>
    a.relationship_id.localeCompare(b.relationship_id),
  )) {
    pushTo(outgoing, r.from_node, r);
    pushTo(incoming, r.to_node, r);
    if (r.directionality === 'bidirectional') {
      pushTo(outgoing, r.to_node, r);
      pushTo(incoming, r.from_node, r);
    }
  }

  const knownNodeIds = new Set<string>([
    ...content.entities.map((e) => e.id),
    ...content.hallmarks.map((h) => h.id),
    ...content.researchApproaches.map((a) => a.id),
    ...content.rejuvenationTargets.map((t) => t.target_id),
  ]);

  return {
    entityById,
    childrenOf: childrenMap,
    ancestorsOf,
    depthOf,
    entitiesByLayer,
    hallmarkById: new Map(content.hallmarks.map((h) => [h.id, h])),
    studyById: new Map(content.studies.map((s) => [s.source_id, s])),
    profileById: new Map(content.evidenceProfiles.map((p) => [p.profile_id, p])),
    approachById: new Map(content.researchApproaches.map((a) => [a.id, a])),
    targetById: new Map(content.rejuvenationTargets.map((t) => [t.target_id, t])),
    observationById: new Map(content.observations.map((o) => [o.observation_id, o])),
    observationsByEntity,
    observationsByHallmark,
    trajectoriesByEntity,
    relationshipById: new Map(content.relationships.map((r) => [r.relationship_id, r])),
    outgoing,
    incoming,
    knownNodeIds,
  };
}
