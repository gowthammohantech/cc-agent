import type { ContentBundle } from './bundle';
import { layerOrdinal } from '@schemas/index';

export interface IntegrityProblem {
  kind: string;
  message: string;
}

/**
 * Checks a schema cannot express: cross-file references, id uniqueness, and
 * the shape of the entity tree.
 */
export function checkReferentialIntegrity(b: ContentBundle): IntegrityProblem[] {
  const problems: IntegrityProblem[] = [];
  const add = (kind: string, message: string) => problems.push({ kind, message });

  const studyIds = new Set(b.studies.map((s) => s.source_id));
  const entityIds = new Set(b.entities.map((e) => e.id));
  const hallmarkIds = new Set(b.hallmarks.map((h) => h.id));
  const approachIds = new Set(b.researchApproaches.map((a) => a.id));
  const populationIds = new Set(b.populations.map((p) => p.id));
  const ageBandIds = new Set(b.ageBands.map((a) => a.id));
  const profileIds = new Set(b.evidenceProfiles.map((p) => p.profile_id));

  // --- id uniqueness -------------------------------------------------------
  const dupCheck = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) add('duplicate_id', `${label} id "${id}" appears more than once`);
      seen.add(id);
    }
  };
  dupCheck(
    'entity',
    b.entities.map((e) => e.id),
  );
  dupCheck(
    'hallmark',
    b.hallmarks.map((h) => h.id),
  );
  dupCheck(
    'study',
    b.studies.map((s) => s.source_id),
  );
  dupCheck(
    'observation',
    b.observations.map((o) => o.observation_id),
  );
  dupCheck(
    'relationship',
    b.relationships.map((r) => r.relationship_id),
  );
  dupCheck(
    'research approach',
    b.researchApproaches.map((a) => a.id),
  );
  dupCheck(
    'rejuvenation target',
    b.rejuvenationTargets.map((t) => t.target_id),
  );
  dupCheck(
    'evidence profile',
    b.evidenceProfiles.map((p) => p.profile_id),
  );

  // --- every citation resolves, and points at a live source ----------------
  const checkCitations = (where: string, cites: readonly { source_id: string }[]) => {
    for (const c of cites) {
      if (!studyIds.has(c.source_id)) {
        add('dangling_citation', `${where} cites unknown source ${c.source_id}`);
      } else if (b.indexes.studyById.get(c.source_id)?.retracted) {
        add('retracted_source', `${where} cites retracted source ${c.source_id}`);
      }
    }
  };

  for (const e of b.entities) {
    checkCitations(`entity ${e.id}`, e.citations);
    if (e.parent_id !== null && !entityIds.has(e.parent_id)) {
      add('dangling_parent', `entity ${e.id} has unknown parent ${e.parent_id}`);
    }
    for (const h of e.hallmark_ids) {
      if (!hallmarkIds.has(h))
        add('dangling_ref', `entity ${e.id} references unknown hallmark ${h}`);
    }
    if (e.parent_id !== null) {
      const parent = b.indexes.entityById.get(e.parent_id);
      if (parent && layerOrdinal(parent.layer) >= layerOrdinal(e.layer)) {
        add(
          'layer_inversion',
          `entity ${e.id} (${e.layer}) is parented to ${parent.id} (${parent.layer}), which does not precede it`,
        );
      }
    }
  }

  // Exactly one root, and no cycles.
  const roots = b.entities.filter((e) => e.parent_id === null);
  if (roots.length !== 1) {
    add('tree_shape', `expected exactly one root entity, found ${roots.length}`);
  }
  for (const e of b.entities) {
    const seen = new Set<string>([e.id]);
    let cur = e.parent_id;
    while (cur !== null) {
      if (seen.has(cur)) {
        add('cycle', `entity ${e.id} sits on a parent cycle through ${cur}`);
        break;
      }
      seen.add(cur);
      cur = b.indexes.entityById.get(cur)?.parent_id ?? null;
    }
  }

  for (const h of b.hallmarks) {
    checkCitations(`hallmark ${h.id}`, h.provenance.citations);
    if (!profileIds.has(h.evidence_profile_id)) {
      add('dangling_ref', `hallmark ${h.id} references unknown profile ${h.evidence_profile_id}`);
    }
    for (const a of h.age_relationships) {
      if (!ageBandIds.has(a.age_band_id)) {
        add('dangling_ref', `hallmark ${h.id} references unknown age band ${a.age_band_id}`);
      }
    }
    for (const e of h.affected_entities) {
      if (!entityIds.has(e)) add('dangling_ref', `hallmark ${h.id} references unknown entity ${e}`);
    }
  }

  for (const o of b.observations) {
    checkCitations(`observation ${o.observation_id}`, o.provenance.citations);
    if (o.effect.kind === 'quantitative') {
      checkCitations(`observation ${o.observation_id} effect`, [o.effect.citation]);
    }
    if (!entityIds.has(o.entity_id)) {
      add(
        'dangling_ref',
        `observation ${o.observation_id} references unknown entity ${o.entity_id}`,
      );
    }
    if (!populationIds.has(o.population_id)) {
      add(
        'dangling_ref',
        `observation ${o.observation_id} references unknown population ${o.population_id}`,
      );
    }
    for (const h of o.hallmark_ids) {
      if (!hallmarkIds.has(h)) {
        add('dangling_ref', `observation ${o.observation_id} references unknown hallmark ${h}`);
      }
    }
  }

  for (const t of b.trajectories) {
    checkCitations(`trajectory ${t.trajectory_id}`, t.provenance.citations);
    for (const p of t.points) checkCitations(`trajectory ${t.trajectory_id} point`, [p.citation]);
    if (!entityIds.has(t.entity_id)) {
      add('dangling_ref', `trajectory ${t.trajectory_id} references unknown entity ${t.entity_id}`);
    }
    if (!populationIds.has(t.population_id)) {
      add(
        'dangling_ref',
        `trajectory ${t.trajectory_id} references unknown population ${t.population_id}`,
      );
    }
  }

  for (const r of b.relationships) {
    checkCitations(`relationship ${r.relationship_id}`, r.provenance.citations);
    for (const [side, node] of [
      ['from_node', r.from_node],
      ['to_node', r.to_node],
    ] as const) {
      if (!b.indexes.knownNodeIds.has(node)) {
        add(
          'dangling_edge',
          `relationship ${r.relationship_id} ${side} "${node}" resolves to nothing`,
        );
      }
    }
  }

  for (const t of b.rejuvenationTargets) {
    checkCitations(`target ${t.target_id}`, t.provenance.citations);
    for (const r of t.risks) checkCitations(`target ${t.target_id} risk`, r.citations);
    checkCitations(`target ${t.target_id} reversibility`, t.reversibility_demonstrated.citations);
    for (const group of [t.human_evidence, t.animal_evidence, t.in_vitro_evidence]) {
      for (const item of group) checkCitations(`target ${t.target_id} evidence`, item.citations);
    }
    for (const a of t.research_approach_ids) {
      if (!approachIds.has(a)) {
        add('dangling_ref', `target ${t.target_id} references unknown research approach ${a}`);
      }
    }
    if (!hallmarkIds.has(t.aging_process) && !entityIds.has(t.aging_process)) {
      add(
        'dangling_ref',
        `target ${t.target_id} aging_process "${t.aging_process}" is neither a hallmark nor an entity`,
      );
    }
  }

  for (const a of b.researchApproaches) {
    checkCitations(`research approach ${a.id}`, a.provenance.citations);
  }
  for (const p of b.evidenceProfiles) {
    for (const [key, dim] of Object.entries(p.dimensions)) {
      checkCitations(`profile ${p.profile_id}.${key}`, dim.citations);
    }
  }
  for (const band of b.ageBands) checkCitations(`age band ${band.id}`, band.citations);

  // --- geometry ------------------------------------------------------------
  // A system is a group of parts, not a single shape, so the binding runs one
  // way only: every part names the entity and system it belongs to. Keeping a
  // reverse key on the entity would let the two drift apart.
  const allParts = [...b.bodyLayout.parts, ...b.bodyLayout.shell];
  const seenKeys = new Set<string>();
  for (const part of allParts) {
    if (seenKeys.has(part.geometry_key)) {
      add('duplicate_id', `body part geometry_key "${part.geometry_key}" appears more than once`);
    }
    seenKeys.add(part.geometry_key);

    if (!entityIds.has(part.entity_id)) {
      add(
        'dangling_ref',
        `body part ${part.geometry_key} references unknown entity ${part.entity_id}`,
      );
    }
    const system = b.indexes.entityById.get(part.system_id);
    if (!system) {
      add(
        'dangling_ref',
        `body part ${part.geometry_key} references unknown system ${part.system_id}`,
      );
    } else if (system.layer !== 'L2_system' && system.id !== 'organism') {
      add(
        'bad_system_ref',
        `body part ${part.geometry_key} names ${part.system_id} as its system, but that is a ${system.layer}`,
      );
    }
  }

  return problems;
}

/**
 * Coverage floors. These stop the application shipping a core that renders
 * empty — a hallmark grid with blank cards is worse than an honest gap,
 * because it reads as absence of change rather than absence of data.
 */
export function checkCoverage(b: ContentBundle): IntegrityProblem[] {
  const problems: IntegrityProblem[] = [];
  const add = (kind: string, message: string) => problems.push({ kind, message });

  if (b.hallmarks.length !== 12) {
    add('coverage', `expected 12 hallmarks (§7), found ${b.hallmarks.length}`);
  }
  const systems = b.entities.filter((e) => e.layer === 'L2_system');
  if (systems.length < 12) {
    add('coverage', `expected at least 12 organ systems (§13), found ${systems.length}`);
  }
  if (b.populations.length < 1) add('coverage', 'no population records defined');
  if (b.ageBands.length < 1) add('coverage', 'no age bands defined');

  for (const h of b.hallmarks) {
    if (!b.indexes.profileById.has(h.evidence_profile_id)) {
      add('coverage', `hallmark ${h.id} has no evidence profile`);
    }
  }

  const coveredSystems = new Set<string>();
  for (const o of b.observations) {
    const chain = [o.entity_id, ...(b.indexes.ancestorsOf.get(o.entity_id) ?? [])];
    for (const id of chain) {
      if (b.indexes.entityById.get(id)?.layer === 'L2_system') coveredSystems.add(id);
    }
  }
  const drawnSystems = new Set(b.bodyLayout.parts.map((p) => p.system_id));
  for (const s of systems) {
    if (!drawnSystems.has(s.id)) {
      add(
        'coverage',
        `organ system ${s.id} has no body-layout parts, so it cannot be shown or selected`,
      );
    }
  }

  if (coveredSystems.size < 6) {
    add(
      'coverage',
      `only ${coveredSystems.size} organ systems have any observation; at least 6 expected for a usable body view`,
    );
  }

  return problems;
}
