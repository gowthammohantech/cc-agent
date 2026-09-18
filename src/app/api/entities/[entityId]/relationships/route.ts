import { apiError, apiOk } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { neighbors } from '@/domain/graph/graph';

/**
 * Prerendered, so no query string reaches this handler. Rather than accept a
 * `direction` filter that would be silently ignored, this returns both
 * directions and lets the caller split on from_node / to_node — the full set is
 * small, and /api/graph/subgraph is the dynamic route for filtered walks.
 */
export const dynamic = 'force-static';

export function generateStaticParams() {
  return getBundle().entities.map((e) => ({ entityId: e.id }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> },
): Promise<Response> {
  const { entityId } = await params;
  const bundle = getBundle();
  if (!bundle.indexes.entityById.has(entityId)) {
    return apiError(404, 'not_found', `No entity with id "${entityId}".`);
  }

  const all = neighbors(bundle, entityId, 'both');
  return apiOk({
    entity_id: entityId,
    relationships: all,
    incoming: all.filter((r) => r.to_node === entityId).map((r) => r.relationship_id),
    outgoing: all.filter((r) => r.from_node === entityId).map((r) => r.relationship_id),
  });
}
