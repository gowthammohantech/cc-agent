import { z } from 'zod';
import { CitationRef, IdSlug, Provenance } from './primitives.js';

/**
 * FR-01 — "never interpolate unsupported scientific claims silently" and
 * "expose missing data".
 *
 * `interpolation: 'none'` is the default posture. Choosing anything else
 * requires writing a rationale, which lands in the diff where a reviewer sees
 * it; and even then the engine tags the resulting sample as `interpolated` so
 * the chart can draw it dashed rather than as a measured line.
 */
export const InterpolationMode = z.enum(['none', 'linear_between_points', 'step_by_band']);
export type InterpolationMode = z.infer<typeof InterpolationMode>;

export const TrajectoryPoint = z.object({
  age: z.number().min(0).max(130),
  value: z.number(),
  interval: z.tuple([z.number(), z.number()]).optional(),
  interval_type: z.enum(['ci95', 'iqr', 'range', 'sd']).optional(),
  citation: CitationRef,
});
export type TrajectoryPoint = z.infer<typeof TrajectoryPoint>;

export const TrajectoryGap = z.object({
  age_min: z.number().min(0).max(130),
  age_max: z.number().min(0).max(130),
  /** Why the gap exists — "not measured in this cohort" is a real finding. */
  reason: z.string().min(10),
});

export const TrajectorySchema = z
  .object({
    trajectory_id: z.string().regex(/^traj_\d+$/, 'trajectory ids look like traj_001'),
    entity_id: IdSlug,
    measure: z.string().min(2),
    unit: z.string().nullable(),
    population_id: IdSlug,
    points: z.array(TrajectoryPoint).min(1),
    supported_age_range: z.tuple([z.number(), z.number()]),
    interpolation: InterpolationMode.default('none'),
    interpolation_rationale: z.string().nullable(),
    gaps: z.array(TrajectoryGap).default([]),
    /** §9 — say what shape this actually has, so the chart cannot imply linearity. */
    shape_note: z.string().min(10),
    provenance: Provenance,
  })
  .refine((t) => t.interpolation === 'none' || (t.interpolation_rationale?.length ?? 0) >= 20, {
    message: 'interpolating between data points requires a written rationale',
    path: ['interpolation_rationale'],
  })
  .refine((t) => t.supported_age_range[0] <= t.supported_age_range[1], {
    message: 'supported_age_range must be ordered',
    path: ['supported_age_range'],
  })
  .refine(
    (t) =>
      t.points.every((p) => p.age >= t.supported_age_range[0] && p.age <= t.supported_age_range[1]),
    { message: 'every point must fall inside supported_age_range', path: ['points'] },
  );
export type Trajectory = z.infer<typeof TrajectorySchema>;

export const TrajectoryFileSchema = z.object({
  trajectories: z.array(TrajectorySchema),
});
