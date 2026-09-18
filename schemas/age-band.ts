import { z } from 'zod';
import { CitationRef, IdSlug } from './primitives';

/**
 * §9 — the timeline is banded rather than smooth, because most curated data is
 * reported over ranges and the UI must not imply that every variable changes
 * linearly with chronological age.
 */
export const AgeBandSchema = z.object({
  id: IdSlug,
  label: z.string().min(2),
  age_min: z.number().min(0).max(130),
  age_max: z.number().min(0).max(130),
  phase: z.enum(['development', 'maturity', 'later_life']),
  description: z.string().min(20),
  /** §9 — data above ~90 is sparse and the UI says so rather than extrapolating. */
  data_sparsity_note: z.string().nullable(),
  citations: z.array(CitationRef).default([]),
  record_version: z.number().int().positive(),
});
export type AgeBand = z.infer<typeof AgeBandSchema>;

export const AgeBandFileSchema = z
  .object({ age_bands: z.array(AgeBandSchema).min(1) })
  .refine((f) => f.age_bands.every((b) => b.age_min <= b.age_max), {
    message: 'every age band needs age_min <= age_max',
  });
