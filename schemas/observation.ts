import { z } from 'zod';
import { CitationRef, Direction, IdSlug, Provenance } from './primitives.js';

/**
 * §31 — "Do not store invented universal percentages."
 *
 * This is enforced structurally rather than by policy. A number can only exist
 * inside an effect of `kind: 'quantitative'`, which requires `source_reported:
 * true` and carries its own citation, separate from the record's provenance. So
 * writing a figure obliges the author to name the source that reported it, at
 * the point the figure is written.
 *
 * `tests/content/percentages.test.ts` closes the remaining gap by scanning prose
 * for bare percentages and fold-changes.
 */
export const QuantitativeEffect = z.object({
  kind: z.literal('quantitative'),
  measure: z.string().min(2),
  unit: z.string(),
  value: z.number(),
  interval: z.tuple([z.number(), z.number()]).optional(),
  interval_type: z.enum(['ci95', 'iqr', 'range', 'sd']).optional(),
  /** Must be literally true: the number came from the cited source, not from us. */
  source_reported: z.literal(true),
  citation: CitationRef,
});

export const QualitativeEffect = z.object({
  kind: z.literal('qualitative'),
  direction: Direction,
  statement: z.string().min(10),
});

export const NotQuantifiedEffect = z.object({
  kind: z.literal('not_quantified'),
  direction: Direction,
  reason: z.string().min(10),
});

export const Effect = z.discriminatedUnion('kind', [
  QuantitativeEffect,
  QualitativeEffect,
  NotQuantifiedEffect,
]);
export type Effect = z.infer<typeof Effect>;

/**
 * §6 Principles 7 and 8 — development is not aging, and disease is not normal
 * aging. Making this a required field means the distinction survives into the
 * rendering layer, where the UI keeps the classes visually separate and never
 * mixes them in one chart series.
 */
export const ChangeClass = z.enum([
  'development',
  'age_associated_change',
  'disease_associated',
  'unclear',
]);
export type ChangeClass = z.infer<typeof ChangeClass>;

export const CHANGE_CLASS_LABEL: Readonly<Record<ChangeClass, string>> = {
  development: 'Developmental change',
  age_associated_change: 'Age-associated change',
  disease_associated: 'Disease-associated',
  unclear: 'Classification unclear',
};

export const TrajectoryType = z.enum([
  'population_association',
  'longitudinal_measurement',
  'cross_sectional',
  'mechanistic_inference',
  'developmental_change',
  'unknown',
]);
export type TrajectoryType = z.infer<typeof TrajectoryType>;

export const ObservationSchema = z
  .object({
    observation_id: z.string().regex(/^obs_\d+$/, 'observation ids look like obs_001'),
    entity_id: IdSlug,
    hallmark_ids: z.array(IdSlug).default([]),
    age_min: z.number().min(0).max(130),
    age_max: z.number().min(0).max(130),
    observation: z.string().min(20),
    trajectory_type: TrajectoryType,
    change_class: ChangeClass,
    population_id: IdSlug,
    effect: Effect,
    provenance: Provenance,
  })
  .refine((o) => o.age_min <= o.age_max, {
    message: 'age_min must be <= age_max',
    path: ['age_min'],
  });
export type Observation = z.infer<typeof ObservationSchema>;

export const ObservationFileSchema = z.object({
  observations: z.array(ObservationSchema),
});
