import { apiError, apiOk } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { badgeFor } from '@/domain/evidence/engine';
import { subgraphAround } from '@/domain/graph/graph';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getBundle().hallmarks.map((h) => ({ id: h.id }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const bundle = getBundle();
  const hallmark = bundle.indexes.hallmarkById.get(id);
  if (!hallmark) return apiError(404, 'not_found', `No hallmark with id "${id}".`);

  const profile = bundle.indexes.profileById.get(hallmark.evidence_profile_id);

  return apiOk({
    hallmark,
    // The badge always ships with its eight-dimension basis (§37) — a client
    // cannot receive the label without the reasoning behind it.
    evidence: profile ? badgeFor(profile) : null,
    observations: (bundle.indexes.observationsByHallmark.get(id) ?? [])
      .map((oid) => bundle.indexes.observationById.get(oid))
      .filter((o) => o !== undefined),
    graph: subgraphAround(bundle, id, 1),
  });
}
