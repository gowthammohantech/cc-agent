import { z } from 'zod';
import { Direction, IdSlug, Provenance } from './primitives.js';

/**
 * FR-03 / §30. Field names follow the FRD's example schema
 * (`age_relationships`, `affected_entities`, `upstream_nodes`,
 * `downstream_nodes`). The example's `evidence_refs` is superseded by
 * `provenance.citations` plus `evidence_profile_id`, which carry strictly more.
 *
 * `framework.version` lets the 2013 and 2023 framings coexist, which is §7's
 * requirement that new frameworks arrive without a database redesign.
 */
export const HallmarkSchema = z.object({
  id: IdSlug,
  name: z.string().min(3),
  description: z.string().min(40),
  framework: z.object({
    name: z.literal('hallmarks_of_aging'),
    version: z.enum(['2013', '2023']),
  }),
  age_relationships: z
    .array(
      z.object({
        age_band_id: IdSlug,
        direction: Direction,
        note: z.string().min(10),
      }),
    )
    .default([]),
  affected_entities: z.array(IdSlug).default([]),
  upstream_nodes: z.array(IdSlug).default([]),
  downstream_nodes: z.array(IdSlug).default([]),
  research_target_ids: z.array(z.string()).default([]),
  evidence_profile_id: z.string(),
  provenance: Provenance,
});
export type Hallmark = z.infer<typeof HallmarkSchema>;
