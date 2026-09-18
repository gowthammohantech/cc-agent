import { apiError, apiOk, DEFAULT_POPULATION } from '@/lib/api';
import { getBundle } from '@/content/bundle';

/** Prerendered; see the note in /api/ages/[age]/overview about query strings. */
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

  const trajectories = (bundle.indexes.trajectoriesByEntity.get(entityId) ?? []).filter(
    (t) => t.population_id === DEFAULT_POPULATION,
  );

  return apiOk({
    entity_id: entityId,
    population_id: DEFAULT_POPULATION,
    trajectories,
    // An empty array here is a curation gap, not an absence of change. Saying so
    // in the payload keeps that distinction alive for any client.
    no_data_reason:
      trajectories.length === 0
        ? 'No curated trajectory for this entity and population. See content/CHANGELOG.md.'
        : null,
  });
}
