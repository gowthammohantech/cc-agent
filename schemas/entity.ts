import { z } from 'zod';
import { CitationRef, IdSlug } from './primitives.js';

/**
 * §8 — the six conceptual layers, flattened into the eight concrete kinds the
 * FRD's hierarchy names (FR-02). Ordinals matter: a parent's layer must precede
 * its child's. Skips are legal (a system directly parents an organ); inversions
 * are not (a cell type may never parent an organ).
 */
export const EntityLayer = z.enum([
  'L1_organism',
  'L2_system',
  'L3_organ',
  'L3_tissue',
  'L4_cell_type',
  'L5_organelle',
  'L5_pathway',
  'L6_biomarker',
]);
export type EntityLayer = z.infer<typeof EntityLayer>;

export const ENTITY_LAYER_ORDER: readonly EntityLayer[] = EntityLayer.options;

export function layerOrdinal(layer: EntityLayer): number {
  return ENTITY_LAYER_ORDER.indexOf(layer);
}

export const ENTITY_LAYER_LABEL: Readonly<Record<EntityLayer, string>> = {
  L1_organism: 'Organism',
  L2_system: 'System',
  L3_organ: 'Organ',
  L3_tissue: 'Tissue',
  L4_cell_type: 'Cell type',
  L5_organelle: 'Organelle',
  L5_pathway: 'Pathway',
  L6_biomarker: 'Biomarker',
};

export const EntityKind = z.enum([
  'organism',
  'system',
  'organ',
  'tissue',
  'cell_type',
  'organelle',
  'pathway',
  'biomarker',
]);
export type EntityKind = z.infer<typeof EntityKind>;

export const BiologicalEntitySchema = z.object({
  id: IdSlug,
  name: z.string().min(2),
  short_name: z.string().optional(),
  description: z.string().min(20),
  layer: EntityLayer,
  kind: EntityKind,
  /** Children are derived from parent_id at load; never stored, never duplicated. */
  parent_id: IdSlug.nullable(),
  hallmark_ids: z.array(IdSlug).default([]),
  /** Links this entity to a shape in content/geometry/body-layout.json. */
  geometry_key: z.string().optional(),
  /** Descriptive prose still needs sources, even when it states no age claim. */
  citations: z.array(CitationRef).default([]),
  record_version: z.number().int().positive(),
});
export type BiologicalEntity = z.infer<typeof BiologicalEntitySchema>;

export const EntityFileSchema = z.object({
  entities: z.array(BiologicalEntitySchema),
});
