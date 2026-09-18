import { z } from 'zod';

/**
 * Shared scientific primitives.
 *
 * This file is the single strongest enforcement point in the codebase. Every
 * claim-bearing record embeds `Provenance`, whose `citations` is `.min(1)` and
 * whose `uncertainty.description` is a required non-trivial string. An uncited
 * or unqualified scientific claim therefore cannot parse, which means it cannot
 * be loaded, cannot pass the build, and cannot reach a reader.
 */

/** §20 — evidence levels, ordered strongest to weakest. Order is meaningful. */
export const EvidenceLevel = z.enum([
  'human_established',
  'human_clinical',
  'human_observational',
  'animal',
  'in_vitro',
  'hypothesis',
  'speculative',
]);
export type EvidenceLevel = z.infer<typeof EvidenceLevel>;

export const EVIDENCE_LEVEL_ORDER: readonly EvidenceLevel[] = EvidenceLevel.options;

export const EVIDENCE_LEVEL_LABEL: Readonly<Record<EvidenceLevel, string>> = {
  human_established: 'Established in humans',
  human_clinical: 'Human clinical research',
  human_observational: 'Human observational',
  animal: 'Animal studies',
  in_vitro: 'Cells / in vitro',
  hypothesis: 'Mechanistic hypothesis',
  speculative: 'Speculative',
};

/**
 * §6 Principle 4 — correlation must never be displayed as causation, so causal
 * standing is recorded separately from evidence strength. A finding can be
 * strong human evidence and still be `correlational_only`.
 */
export const CausalStatus = z.enum([
  'established_causal',
  'supported_mechanistically',
  'proposed',
  'correlational_only',
  'disputed',
  'unknown',
]);
export type CausalStatus = z.infer<typeof CausalStatus>;

export const CAUSAL_STATUS_LABEL: Readonly<Record<CausalStatus, string>> = {
  established_causal: 'Established causal',
  supported_mechanistically: 'Mechanistically supported',
  proposed: 'Proposed',
  correlational_only: 'Correlational only',
  disputed: 'Disputed',
  unknown: 'Unknown',
};

export const ReviewStatus = z.enum(['draft', 'in_review', 'approved', 'needs_revision', 'retired']);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export const Confidence = z.enum(['high', 'moderate', 'low', 'very_low', 'not_assessed']);
export type Confidence = z.infer<typeof Confidence>;

/** Direction of an age-associated difference. */
export const Direction = z.enum([
  'increases',
  'decreases',
  'changes_qualitatively',
  'stable',
  'tissue_dependent',
  'individual_variable',
  'unclear',
]);
export type Direction = z.infer<typeof Direction>;

export const Tri = z.enum(['yes', 'partial', 'no', 'unknown']);
export type Tri = z.infer<typeof Tri>;

export const SourceId = z.string().regex(/^SRC-\d{3,}$/, 'source ids look like SRC-001');
export const IdSlug = z
  .string()
  .regex(/^[a-z0-9_]+$/, 'ids are lowercase snake_case, e.g. skeletal_muscle');

export const IsoDate = z.iso.date();

export const CitationRef = z.object({
  source_id: SourceId,
  /** Where in the source, e.g. "Fig. 2", "Table 1", "p. 1201". */
  locator: z.string().optional(),
  supports: z.enum(['direct', 'contextual', 'contrasting']).default('direct'),
});
export type CitationRef = z.infer<typeof CitationRef>;

export const Uncertainty = z.object({
  /**
   * Required, and required to say something. "Unknown" is an acceptable
   * scientific position; an empty field is not, because it is indistinguishable
   * from nobody having thought about it.
   */
  description: z.string().min(10, 'state the uncertainty; an empty note is not a position'),
  known_conflicts: z.array(z.string()).default([]),
  generalizability: z.enum([
    'population_average',
    'tissue_dependent',
    'individual_variable',
    'unclear',
  ]),
});
export type Uncertainty = z.infer<typeof Uncertainty>;

/** Embedded by every claim-bearing record. */
export const Provenance = z.object({
  evidence_level: EvidenceLevel,
  causal_status: CausalStatus,
  review_status: ReviewStatus,
  confidence: Confidence,
  citations: z.array(CitationRef).min(1, 'every scientific claim needs at least one source'),
  uncertainty: Uncertainty,
  reviewed_by: z.string().nullable(),
  reviewed_at: IsoDate.nullable(),
  record_version: z.number().int().positive(),
});
export type Provenance = z.infer<typeof Provenance>;

/**
 * `approved` is a statement that a named human checked this record. Without the
 * CMS of FR-11, that claim has to be carried by the data itself or it means
 * nothing.
 */
export const ProvenanceSchema = Provenance.refine(
  (p) => p.review_status !== 'approved' || (p.reviewed_by !== null && p.reviewed_at !== null),
  { message: "review_status 'approved' requires both reviewed_by and reviewed_at" },
);
