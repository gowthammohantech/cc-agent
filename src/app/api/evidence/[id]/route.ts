import { apiError, apiOk } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { badgeFor } from '@/domain/evidence/engine';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getBundle().evidenceProfiles.map((p) => ({ id: p.profile_id }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const profile = getBundle().indexes.profileById.get(id);
  if (!profile) return apiError(404, 'not_found', `No evidence profile with id "${id}".`);
  return apiOk(badgeFor(profile));
}
