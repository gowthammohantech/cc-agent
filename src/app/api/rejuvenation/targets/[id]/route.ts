import { apiError, apiOk } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { getTargetDetail } from '@/domain/rejuvenation/engine';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getBundle().rejuvenationTargets.map((t) => ({ id: t.target_id }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const bundle = getBundle();
  const detail = getTargetDetail(bundle, id);
  if (!detail) return apiError(404, 'not_found', `No rejuvenation target with id "${id}".`);

  return apiOk({ ...detail, systemic_caveat: bundle.disclaimers.systemic_caveat });
}
