import { apiOk } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { CONTENT_GENERATED_AT, CONTENT_VERSION, RECORDS_HASH } from '@/content/version';

export const dynamic = 'force-static';

export function GET(): Response {
  const bundle = getBundle();
  return apiOk({
    content_version: CONTENT_VERSION,
    generated_at: CONTENT_GENERATED_AT,
    records_hash: RECORDS_HASH,
    counts: {
      entities: bundle.entities.length,
      hallmarks: bundle.hallmarks.length,
      observations: bundle.observations.length,
      trajectories: bundle.trajectories.length,
      relationships: bundle.relationships.length,
      rejuvenation_targets: bundle.rejuvenationTargets.length,
      research_approaches: bundle.researchApproaches.length,
      studies: bundle.studies.length,
    },
    review_posture:
      'Seed content ships as in_review and has not been reviewed by a domain expert. Source identifiers are transcribed, not registry-verified.',
  });
}
