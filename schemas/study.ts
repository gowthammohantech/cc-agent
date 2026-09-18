import { z } from 'zod';
import { IsoDate, SourceId } from './primitives';

/**
 * FR-09 / §36 — the minimum source record, with a few additions the spec
 * implies elsewhere: `retracted` (FR-17 "flag outdated evidence"), and
 * `last_checked_at` so staleness is measurable rather than assumed.
 *
 * `limitations` is `.min(1)`: every study has limitations, and an author who
 * cannot name one has not read the paper closely enough to cite it.
 */
export const StudySchema = z
  .object({
    source_id: SourceId,
    title: z.string().min(5),
    authors: z.array(z.string()).min(1),
    journal: z.string().min(2),
    year: z.number().int().min(1800).max(2100),
    doi: z.string().nullable(),
    url: z.url().nullable(),
    study_type: z.enum([
      'randomized_trial',
      'cohort',
      'case_control',
      'cross_sectional',
      'systematic_review',
      'meta_analysis',
      'narrative_review',
      'animal_study',
      'in_vitro_study',
      'preprint',
      'consensus_statement',
      'other',
    ]),
    species: z.enum([
      'human',
      'mouse',
      'rat',
      'primate',
      'c_elegans',
      'drosophila',
      'cell_line',
      'multiple',
      'other',
    ]),
    population: z.string().min(3),
    sample_size: z.number().int().positive().nullable(),
    limitations: z.array(z.string()).min(1, 'name at least one limitation of this source'),
    reviewed_by: z.string().nullable(),
    reviewed_at: IsoDate.nullable(),
    retracted: z.boolean().default(false),
    /**
     * How this reference's identifiers were checked.
     *
     * The build environment has no scholarly network egress, so the seed corpus
     * cannot machine-verify DOIs against Crossref. Rather than let unverified
     * identifiers pass as verified — which is exactly the kind of quiet
     * overclaim this product exists to avoid — verification status is recorded
     * per source and surfaced in the UI.
     *
     * `unverified_offline` means: transcribed from a well-known reference,
     * identifier not yet resolved against a registry. Treat the identifier as
     * a lead to check, not as a guarantee.
     */
    reference_verification: z
      .enum(['machine_verified', 'manually_verified', 'unverified_offline'])
      .default('unverified_offline'),
    verified_at: IsoDate.nullable().default(null),
    added_at: IsoDate,
    last_checked_at: IsoDate,
    record_version: z.number().int().positive(),
  })
  .refine((s) => s.doi !== null || s.url !== null, {
    message: 'a source needs a DOI or a URL so a reader can actually find it',
    path: ['doi'],
  })
  .refine((s) => s.reference_verification === 'unverified_offline' || s.verified_at !== null, {
    message: 'claiming a verified reference requires the date it was verified',
    path: ['verified_at'],
  });
export type Study = z.infer<typeof StudySchema>;

export const StudyFileSchema = z.object({
  studies: z.array(StudySchema),
});
