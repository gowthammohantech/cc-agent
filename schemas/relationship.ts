import { z } from 'zod';
import { Provenance } from './primitives.js';

/** §22 / §32 — the graph edge vocabulary. */
export const RelationshipType = z.enum([
  'ASSOCIATED_WITH',
  'CONTRIBUTES_TO',
  'ACTIVATES',
  'INHIBITS',
  'DAMAGES',
  'REPAIRS',
  'CLEARS',
  'REGENERATES',
  'UNKNOWN_RELATIONSHIP',
]);
export type RelationshipType = z.infer<typeof RelationshipType>;

export const RELATIONSHIP_LABEL: Readonly<Record<RelationshipType, string>> = {
  ASSOCIATED_WITH: 'is associated with',
  CONTRIBUTES_TO: 'contributes to',
  ACTIVATES: 'activates',
  INHIBITS: 'inhibits',
  DAMAGES: 'damages',
  REPAIRS: 'repairs',
  CLEARS: 'clears',
  REGENERATES: 'regenerates',
  UNKNOWN_RELATIONSHIP: 'has an unknown relationship to',
};

/**
 * A node id may reference an entity, a hallmark, a research approach or an
 * outcome; referential integrity is checked across that whole id space at load
 * and in tests, so a dangling endpoint fails the build.
 */
export const RelationshipSchema = z.object({
  relationship_id: z.string().regex(/^rel_\d+$/, 'relationship ids look like rel_001'),
  from_node: z.string(),
  to_node: z.string(),
  relationship: RelationshipType,
  directionality: z.enum(['directed', 'bidirectional', 'undetermined']).default('directed'),
  /** Some relationships only hold in a given age window; null means unrestricted. */
  age_context: z
    .object({ age_min: z.number().min(0).max(130), age_max: z.number().min(0).max(130) })
    .nullable(),
  mechanism_note: z.string().nullable(),
  provenance: Provenance,
});
export type Relationship = z.infer<typeof RelationshipSchema>;

export const RelationshipFileSchema = z.object({
  relationships: z.array(RelationshipSchema),
});
