import { z } from 'zod';
import { apiError, apiOk, DEFAULT_POPULATION, parseOr400 } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { compareAges } from '@/domain/compare/engine';

export const dynamic = 'force-dynamic';

const Query = z.object({
  ageA: z.coerce.number().min(0).max(130),
  ageB: z.coerce.number().min(0).max(130),
  dimensions: z.string().optional(),
  pop: z.string().default(DEFAULT_POPULATION),
});

export function GET(request: Request): Response {
  const url = new URL(request.url);
  const parsed = parseOr400(Query, Object.fromEntries(url.searchParams));
  if (!parsed.ok) return parsed.response;

  const { ageA, ageB, dimensions, pop } = parsed.value;
  try {
    return apiOk(
      compareAges(getBundle(), {
        ageA,
        ageB,
        dimensions: dimensions ? dimensions.split(',').filter(Boolean) : [],
        populationId: pop,
      }),
    );
  } catch (err) {
    return apiError(400, 'unknown_population', err instanceof Error ? err.message : 'Bad request');
  }
}
