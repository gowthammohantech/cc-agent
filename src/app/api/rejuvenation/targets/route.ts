import { apiOk } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { getTargets } from '@/domain/rejuvenation/engine';

export const dynamic = 'force-static';

export function GET(): Response {
  const bundle = getBundle();
  return apiOk({
    targets: getTargets(bundle),
    // §19 — the caveat travels with the list, so a client cannot render the
    // targets as a checklist of things that have been achieved.
    systemic_caveat: bundle.disclaimers.systemic_caveat,
  });
}
