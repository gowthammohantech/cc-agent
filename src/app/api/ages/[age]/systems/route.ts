import { apiOk, AgeParam, DEFAULT_POPULATION, enumerableAges, parseOr400 } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { getSystemsAtAge } from '@/domain/timeline/engine';

/**
 * Prerendered, so this handler never sees a query string — Next serves the same
 * static payload whatever is appended to the URL. Accepting a `pop` parameter
 * here would therefore be a lie: it would look like it worked while silently
 * returning the default population's data.
 *
 * The corpus has one population today, and the response says which one it
 * describes (§15). A second population will need these routes to go dynamic, or
 * to carry the population in the path.
 */
export const dynamic = 'force-static';

export function generateStaticParams() {
  return enumerableAges().map((age) => ({ age }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ age: string }> },
): Promise<Response> {
  const { age: rawAge } = await params;
  const parsed = parseOr400(AgeParam, rawAge);
  if (!parsed.ok) return parsed.response;

  return apiOk(
    getSystemsAtAge(getBundle(), { age: parsed.value, populationId: DEFAULT_POPULATION }),
  );
}
