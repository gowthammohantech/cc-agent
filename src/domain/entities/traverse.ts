import type { BiologicalEntity, EntityLayer } from '@schemas/index';
import { ENTITY_LAYER_LABEL } from '@schemas/index';
import type { ContentBundle } from '@/content/bundle';

export interface ZoomStep {
  entity: BiologicalEntity;
  layer: EntityLayer;
  layerLabel: string;
  depth: number;
}

export function ancestors(bundle: ContentBundle, id: string): BiologicalEntity[] {
  return (bundle.indexes.ancestorsOf.get(id) ?? [])
    .map((a) => bundle.indexes.entityById.get(a))
    .filter((e): e is BiologicalEntity => e !== undefined);
}

export function children(bundle: ContentBundle, id: string): BiologicalEntity[] {
  return (bundle.indexes.childrenOf.get(id) ?? [])
    .map((c) => bundle.indexes.entityById.get(c))
    .filter((e): e is BiologicalEntity => e !== undefined);
}

/** Breadth-first, deterministic because childrenOf is name-sorted at build. */
export function descendants(
  bundle: ContentBundle,
  id: string,
  maxDepth = Number.POSITIVE_INFINITY,
): BiologicalEntity[] {
  const out: BiologicalEntity[] = [];
  const queue: Array<{ id: string; depth: number }> = [{ id, depth: 0 }];
  const seen = new Set<string>([id]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    if (current.depth >= maxDepth) continue;

    for (const child of bundle.indexes.childrenOf.get(current.id) ?? []) {
      if (seen.has(child)) continue;
      seen.add(child);
      const entity = bundle.indexes.entityById.get(child);
      if (entity) {
        out.push(entity);
        queue.push({ id: child, depth: current.depth + 1 });
      }
    }
  }
  return out;
}

/**
 * The root-to-entity path that powers P5's BODY → SYSTEM → ORGAN → TISSUE →
 * CELL → ORGANELLE → PATHWAY ladder. The age selection is held constant while
 * moving along it — that vertical movement at a fixed age is the whole point of
 * §8.
 */
export function zoomPath(bundle: ContentBundle, id: string): ZoomStep[] {
  const entity = bundle.indexes.entityById.get(id);
  if (!entity) return [];

  return [...ancestors(bundle, id), entity].map((e, depth) => ({
    entity: e,
    layer: e.layer,
    layerLabel: ENTITY_LAYER_LABEL[e.layer],
    depth,
  }));
}

export function entitiesAtLayer(bundle: ContentBundle, layer: EntityLayer): BiologicalEntity[] {
  return (bundle.indexes.entitiesByLayer.get(layer) ?? [])
    .map((id) => bundle.indexes.entityById.get(id))
    .filter((e): e is BiologicalEntity => e !== undefined);
}

export function systemOf(bundle: ContentBundle, id: string): BiologicalEntity | null {
  const entity = bundle.indexes.entityById.get(id);
  if (!entity) return null;
  if (entity.layer === 'L2_system') return entity;
  return ancestors(bundle, id).find((a) => a.layer === 'L2_system') ?? null;
}
