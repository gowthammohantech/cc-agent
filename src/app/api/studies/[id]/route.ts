import { apiError, apiOk } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { stalenessOf } from '@/domain/evidence/engine';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getBundle().studies.map((s) => ({ id: s.source_id }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const study = getBundle().indexes.studyById.get(id);
  if (!study) return apiError(404, 'not_found', `No source with id "${id}".`);
  return apiOk({ study, staleness: stalenessOf(study) });
}
