import { z } from 'zod';
import { CitationRef, EvidenceLevel, IsoDate } from './primitives';

/**
 * FR-10 / §37 — "Do not reduce all evidence to one misleading number."
 *
 * Note what is absent: there is no numeric score field anywhere in this schema,
 * and `overall_label` is authored, not computed. Nothing in the codebase
 * averages these dimensions into a rating, and a unit test asserts that
 * `badgeFor()` is not such a reduction — because the natural "improvement"
 * someone will one day propose is exactly the thing §37 forbids.
 */
export const Rating = z.enum([
  'strong',
  'moderate',
  'limited',
  'very_limited',
  'not_assessed',
  'not_applicable',
]);
export type Rating = z.infer<typeof Rating>;

export const RATING_LABEL: Readonly<Record<Rating, string>> = {
  strong: 'Strong',
  moderate: 'Moderate',
  limited: 'Limited',
  very_limited: 'Very limited',
  not_assessed: 'Not assessed',
  not_applicable: 'Not applicable',
};

const Dimension = z.object({
  rating: Rating,
  note: z.string().min(10),
  citations: z.array(CitationRef).default([]),
});
export type EvidenceDimension = z.infer<typeof Dimension>;

/** The eight dimensions §37 names, all mandatory. */
export const EVIDENCE_DIMENSION_KEYS = [
  'species_relevance',
  'study_design',
  'replication',
  'sample_adequacy',
  'mechanistic_support',
  'clinical_relevance',
  'consistency',
  'recency',
] as const;
export type EvidenceDimensionKey = (typeof EVIDENCE_DIMENSION_KEYS)[number];

export const EVIDENCE_DIMENSION_LABEL: Readonly<Record<EvidenceDimensionKey, string>> = {
  species_relevance: 'Species relevance',
  study_design: 'Study design',
  replication: 'Replication',
  sample_adequacy: 'Sample adequacy',
  mechanistic_support: 'Mechanistic support',
  clinical_relevance: 'Clinical relevance',
  consistency: 'Consistency',
  recency: 'Recency',
};

export const EvidenceProfileSchema = z.object({
  profile_id: z.string().min(3),
  dimensions: z.object({
    species_relevance: Dimension,
    study_design: Dimension,
    replication: Dimension,
    sample_adequacy: Dimension,
    mechanistic_support: Dimension,
    clinical_relevance: Dimension,
    consistency: Dimension,
    recency: Dimension,
  }),
  /** Categorical, authored by a human, never derived from the dimensions above. */
  overall_label: EvidenceLevel,
  /** Always shown when the badge is expanded — the label must justify itself. */
  label_basis: z.string().min(20),
  last_reviewed_at: IsoDate,
  record_version: z.number().int().positive(),
});
export type EvidenceProfile = z.infer<typeof EvidenceProfileSchema>;

export const EvidenceProfileFileSchema = z.object({
  evidence_profiles: z.array(EvidenceProfileSchema),
});
