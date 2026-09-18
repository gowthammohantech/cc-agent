import { z } from 'zod';
import { CausalStatus, Confidence, ReviewStatus } from './primitives';
import { RelationshipType } from './relationship';

/**
 * FR-08 model parameters, held as reviewable content rather than code so that
 * changing how the simulation propagates is a diff a scientist can read.
 */
export const EdgeSemantics = z.object({
  /** +1 improves the target, -1 worsens it, 0 carries no direction. */
  sign: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
  propagates: z.boolean(),
});

export const SimulationModelSchema = z
  .object({
    model_version: z.string().min(2),
    edge_semantics: z.record(RelationshipType, EdgeSemantics),
    confidence_multipliers: z.record(Confidence, z.number().min(0).max(1)),
    /**
     * §6 Principle 4, made operational: only these causal standings may carry a
     * simulated consequence. `correlational_only` is deliberately excluded, so
     * a correlation can never become a predicted effect.
     */
    propagating_causal_statuses: z.array(CausalStatus).min(1),
    /**
     * The seed corpus ships `in_review`, so gating propagation on `approved`
     * alone would block every edge and silently return an empty simulation.
     * Which statuses may propagate is therefore explicit content, not a
     * hardcoded assumption.
     */
    propagating_review_statuses: z.array(ReviewStatus).min(1),
    min_confidence: z.number().min(0).max(1),
    max_depth: z.number().int().min(1).max(10),
    max_iterations: z.number().int().positive(),
    disclaimer: z.string().min(20),
    bounds_description: z.string().min(40),
  })
  .refine((m) => m.disclaimer.includes('NOT A CLINICAL PREDICTION'), {
    message: 'the simulation disclaimer must carry the literal §21 wording',
    path: ['disclaimer'],
  })
  .refine((m) => !m.propagating_causal_statuses.includes('correlational_only'), {
    message: 'correlation must never propagate as a simulated consequence (§6 Principle 4)',
    path: ['propagating_causal_statuses'],
  });
export type SimulationModel = z.infer<typeof SimulationModelSchema>;

export const ModificationDirection = z.enum(['improve', 'reduce', 'restore']);
export type ModificationDirection = z.infer<typeof ModificationDirection>;

export const SimulationInputSchema = z.object({
  chronological_age: z.number().min(0).max(130),
  reference_age: z.number().min(0).max(130),
  population_id: z.string().default('general_adult'),
  modifications: z
    .array(
      z.object({
        target: z.string(),
        direction: ModificationDirection,
      }),
    )
    .min(1)
    .max(8),
  model_version: z.string().default('v1'),
});
export type SimulationInput = z.infer<typeof SimulationInputSchema>;
