import { z } from 'zod';
import { RejuvenationScope } from './rejuvenation';

/** Product copy that carries scientific meaning, kept in content for review. */
export const DisclaimersSchema = z.object({
  global: z.string().min(20),
  pending_review: z.string().min(20),
  not_medical_advice: z.string().min(20),
  simulation: z.string().min(20),
  stylization: z.string().min(40),
  systemic_caveat: z.string().min(40),
});
export type Disclaimers = z.infer<typeof DisclaimersSchema>;

/** §49 — the seven distinct meanings the product keeps separate. */
export const RejuvenationDefinitionsSchema = z.object({
  preamble: z.string().min(40),
  definitions: z
    .array(
      z.object({
        scope: RejuvenationScope,
        name: z.string().min(3),
        definition: z.string().min(30),
        what_it_does_not_mean: z.string().min(20),
      }),
    )
    .length(7, 'all seven §49 definitions must be present'),
});
export type RejuvenationDefinitions = z.infer<typeof RejuvenationDefinitionsSchema>;
