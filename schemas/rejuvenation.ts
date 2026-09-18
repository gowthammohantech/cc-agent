import { z } from 'zod';
import { CitationRef, IdSlug, Provenance, Tri } from './primitives';

/**
 * §49 — the product must not use "reverse aging" as a single measurable claim.
 * These seven scopes are the distinctions it draws instead, ordered from the
 * weakest claim to the strongest. `whole_organism` is deliberately last and is
 * never asserted by the seed corpus.
 */
export const RejuvenationScope = z.enum([
  'functional',
  'cellular',
  'molecular_epigenetic',
  'tissue',
  'organ',
  'systemic',
  'whole_organism',
]);
export type RejuvenationScope = z.infer<typeof RejuvenationScope>;

export const REJUVENATION_SCOPE_LABEL: Readonly<Record<RejuvenationScope, string>> = {
  functional: 'Functional rejuvenation',
  cellular: 'Cellular rejuvenation',
  molecular_epigenetic: 'Molecular / epigenetic rejuvenation',
  tissue: 'Tissue rejuvenation',
  organ: 'Organ rejuvenation',
  systemic: 'Systemic rejuvenation',
  whole_organism: 'Whole-organism age reversal',
};

export const ClinicalStatus = z.enum([
  'not_applicable',
  'preclinical',
  'experimental',
  'investigational_trials',
  'approved_for_other_indication',
  'standard_of_care',
]);
export type ClinicalStatus = z.infer<typeof ClinicalStatus>;

export const ResearchApproachSchema = z.object({
  id: IdSlug,
  name: z.string().min(3),
  description: z.string().min(40),
  /** §20's badge, at the level of the whole research category. */
  maturity: ClinicalStatus,
  provenance: Provenance,
});
export type ResearchApproach = z.infer<typeof ResearchApproachSchema>;

export const ResearchApproachFileSchema = z.object({
  research_approaches: z.array(ResearchApproachSchema),
});

const EvidenceItem = z.object({
  summary: z.string().min(20),
  citations: z.array(CitationRef).min(1),
});

/**
 * FR-07 / §34.
 *
 * `risks` and `unknowns` are both `.min(1)`. That is the point of the schema:
 * it is structurally impossible to publish a rejuvenation target that reads as
 * an endorsement, because a record with no stated risk and no stated unknown
 * cannot parse.
 */
export const RejuvenationTargetSchema = z.object({
  target_id: z.string().regex(/^target_\d+$/, 'target ids look like target_001'),
  name: z.string().min(3),
  aging_process: IdSlug,
  desired_direction: z.string().min(10),
  rejuvenation_scope: RejuvenationScope,
  research_approach_ids: z.array(IdSlug).min(1),
  human_evidence: z.array(EvidenceItem).default([]),
  animal_evidence: z.array(EvidenceItem).default([]),
  in_vitro_evidence: z.array(EvidenceItem).default([]),
  risks: z
    .array(
      z.object({
        risk: z.string().min(10),
        severity: z.enum(['theoretical', 'observed_preclinical', 'observed_clinical']),
        citations: z.array(CitationRef).min(1),
      }),
    )
    .min(1, 'a rejuvenation target with no stated risk is an endorsement, not a record'),
  unknowns: z.array(z.string().min(10)).min(1, 'state what is not known; "nothing" is never true'),
  clinical_status: ClinicalStatus,
  /** BO-06 at the schema level: reversibility is tracked per species, never merged. */
  reversibility_demonstrated: z.object({
    in_vitro: Tri,
    in_animals: Tri,
    in_humans: Tri,
    note: z.string().min(20),
    citations: z.array(CitationRef).default([]),
  }),
  provenance: Provenance,
});
export type RejuvenationTarget = z.infer<typeof RejuvenationTargetSchema>;
