import type {
  ClinicalStatus,
  RejuvenationScope,
  RejuvenationTarget,
  ResearchApproach,
} from '@schemas/index';
import type { ContentBundle } from '@/content/bundle';

export interface TargetFilter {
  hallmarkId?: string;
  scope?: RejuvenationScope;
  clinicalStatus?: ClinicalStatus;
}

export function getTargets(bundle: ContentBundle, filter?: TargetFilter): RejuvenationTarget[] {
  return bundle.rejuvenationTargets
    .filter((t) => !filter?.hallmarkId || t.aging_process === filter.hallmarkId)
    .filter((t) => !filter?.scope || t.rejuvenation_scope === filter.scope)
    .filter((t) => !filter?.clinicalStatus || t.clinical_status === filter.clinicalStatus)
    .sort((a, b) => a.target_id.localeCompare(b.target_id));
}

/** §18's seven-step chain, materialised for one target. */
export interface TargetChainStep {
  step:
    | 'observed_state'
    | 'candidate_target'
    | 'mechanism'
    | 'research_approach'
    | 'evidence_level'
    | 'risks'
    | 'unknowns';
  label: string;
  content: readonly string[];
}

export interface TargetDetail {
  target: RejuvenationTarget;
  approaches: readonly ResearchApproach[];
  chain: readonly TargetChainStep[];
  processName: string;
}

export function getTargetDetail(bundle: ContentBundle, targetId: string): TargetDetail | null {
  const target = bundle.indexes.targetById.get(targetId);
  if (!target) return null;

  const approaches = target.research_approach_ids
    .map((id) => bundle.indexes.approachById.get(id))
    .filter((a): a is ResearchApproach => a !== undefined);

  const hallmark = bundle.indexes.hallmarkById.get(target.aging_process);
  const entity = bundle.indexes.entityById.get(target.aging_process);
  const processName = hallmark?.name ?? entity?.name ?? target.aging_process;

  const observed = bundle.observations
    .filter(
      (o) => o.hallmark_ids.includes(target.aging_process) || o.entity_id === target.aging_process,
    )
    .map((o) => o.observation);

  const chain: TargetChainStep[] = [
    {
      step: 'observed_state',
      label: 'Observed age-associated state',
      content: observed.length > 0 ? observed : ['No curated observation for this process yet.'],
    },
    { step: 'candidate_target', label: 'Candidate biological target', content: [processName] },
    { step: 'mechanism', label: 'Desired direction', content: [target.desired_direction] },
    {
      step: 'research_approach',
      label: 'Research approaches',
      content: approaches.map((a) => `${a.name} — ${a.description}`),
    },
    {
      step: 'evidence_level',
      label: 'Evidence level',
      content: [
        `${target.provenance.evidence_level} (${target.provenance.causal_status}); clinical status: ${target.clinical_status}`,
        target.reversibility_demonstrated.note,
      ],
    },
    {
      step: 'risks',
      label: 'Known risks',
      content: target.risks.map((r) => `${r.risk} [${r.severity}]`),
    },
    { step: 'unknowns', label: 'Unknowns', content: target.unknowns },
  ];

  return { target, approaches, chain, processName };
}

export interface ExplorerRow {
  target: RejuvenationTarget;
  scope: RejuvenationScope;
  processName: string;
  chain: readonly TargetChainStep[];
}

export interface ExplorerView {
  selectedAge: number;
  referenceAge: number;
  rows: readonly ExplorerRow[];
  /**
   * §19 — rendered above every explorer view. Solving one dimension does not
   * establish whole-organism rejuvenation, and a list of targets reads like a
   * checklist unless that is said plainly and kept on screen.
   */
  systemicCaveat: string;
}

export function explorerView(
  bundle: ContentBundle,
  opts: { selectedAge: number; referenceAge: number },
): ExplorerView {
  const rows = getTargets(bundle)
    .map((target) => {
      const detail = getTargetDetail(bundle, target.target_id);
      return detail
        ? {
            target,
            scope: target.rejuvenation_scope,
            processName: detail.processName,
            chain: detail.chain,
          }
        : null;
    })
    .filter((r): r is ExplorerRow => r !== null);

  return {
    selectedAge: opts.selectedAge,
    referenceAge: opts.referenceAge,
    rows,
    systemicCaveat: bundle.disclaimers.systemic_caveat,
  };
}
