import { z } from 'zod';
import { apiOk, parseOr400 } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { subgraphAround, wholeGraph } from '@/domain/graph/graph';
import { CausalStatus, EvidenceLevel } from '@schemas/index';

export const dynamic = 'force-dynamic';

const Query = z.object({
  node: z.string().optional(),
  depth: z.coerce.number().int().min(1).max(6).default(1),
  minEvidence: EvidenceLevel.optional(),
  causalStatus: z.string().optional(),
  atAge: z.coerce.number().min(0).max(130).optional(),
});

export function GET(request: Request): Response {
  const parsed = parseOr400(Query, Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.ok) return parsed.response;

  const { node, depth, minEvidence, causalStatus, atAge } = parsed.value;
  const statuses = causalStatus
    ?.split(',')
    .filter((s): s is z.infer<typeof CausalStatus> => CausalStatus.safeParse(s).success);

  const filter = {
    ...(minEvidence ? { minEvidence } : {}),
    ...(statuses && statuses.length > 0 ? { causalStatuses: statuses } : {}),
    ...(atAge !== undefined ? { atAge } : {}),
  };

  const bundle = getBundle();
  return apiOk(node ? subgraphAround(bundle, node, depth, filter) : wholeGraph(bundle, filter));
}
