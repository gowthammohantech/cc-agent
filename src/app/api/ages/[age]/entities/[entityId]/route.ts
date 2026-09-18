import { apiError, apiOk, AgeParam, DEFAULT_POPULATION, parseOr400 } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { getEntityAtAge } from '@/domain/timeline/engine';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ age: string; entityId: string }> },
): Promise<Response> {
  const { age: rawAge, entityId } = await params;
  const parsed = parseOr400(AgeParam, rawAge);
  if (!parsed.ok) return parsed.response;

  const population = new URL(request.url).searchParams.get('pop') ?? DEFAULT_POPULATION;
  try {
    const state = getEntityAtAge(
      getBundle(),
      { age: parsed.value, populationId: population },
      entityId,
    );
    if (!state) return apiError(404, 'not_found', `No entity with id "${entityId}".`);
    return apiOk(state);
  } catch (err) {
    return apiError(400, 'unknown_population', err instanceof Error ? err.message : 'Bad request');
  }
}
