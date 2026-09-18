import { z } from 'zod';
import { IdSlug } from './primitives';

/**
 * §15 — every comparison must carry population context. A value without a
 * population is not a scientific statement, so `population_id` is required on
 * observations and trajectories and the UI always renders the chip.
 */
export const PopulationSchema = z.object({
  id: IdSlug,
  label: z.string().min(2),
  sex: z.enum(['female', 'male', 'mixed', 'unspecified']),
  ancestry_note: z.string(),
  cohort_note: z.string(),
  health_context: z.enum(['general', 'healthy_selected', 'clinical']),
  caveats: z.array(z.string()).min(1, 'state at least one limit on generalizing from this group'),
  record_version: z.number().int().positive(),
});
export type Population = z.infer<typeof PopulationSchema>;

export const PopulationFileSchema = z.object({
  populations: z.array(PopulationSchema),
});
