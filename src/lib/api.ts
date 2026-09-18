import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getBundle } from '@/content/bundle';
import { CONTENT_GENERATED_AT } from '@/content/version';

/**
 * Every response carries the content version and the standing disclaimer, so a
 * payload that is copied, cached or screenshotted stays traceable to an exact
 * scientific content state and never travels without its caveat.
 */
export interface ApiMeta {
  content_version: string;
  generated_at: string;
  disclaimer: string;
}

export function apiOk<T>(data: T, extraMeta: Record<string, string> = {}): NextResponse {
  const bundle = getBundle();
  return NextResponse.json({
    data,
    meta: {
      content_version: bundle.contentVersion,
      generated_at: CONTENT_GENERATED_AT,
      disclaimer: bundle.disclaimers.global,
      ...extraMeta,
    } satisfies Partial<ApiMeta> & Record<string, string>,
  });
}

export function apiError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function parseOr400<T>(
  schema: z.ZodType<T>,
  input: unknown,
): { ok: true; value: T } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: {
          code: 'invalid_request',
          message: 'Request parameters failed validation.',
          issues: result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
      },
      { status: 400 },
    ),
  };
}

export const AgeParam = z.coerce.number().min(0).max(130);
export const DEFAULT_POPULATION = 'general_adult';

/** Ages we prerender. 0–120 covers the slider with room past its ceiling. */
export function enumerableAges(): string[] {
  return Array.from({ length: 121 }, (_, i) => String(i));
}
