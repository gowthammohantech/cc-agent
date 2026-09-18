import { SimulationInputSchema } from '@schemas/index';
import { apiError, parseOr400 } from '@/lib/api';
import { getBundle } from '@/content/bundle';
import { runSimulation } from '@/domain/simulation/engine';
import { serializeSimulation } from '@/domain/simulation/serialize';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /simulations.
 *
 * Nothing is logged: the body is a question about a hypothetical, but it is
 * still a question someone asked, and there is no reason to keep it.
 * `no-store` because the response is per-request and must not be cached by an
 * intermediary alongside its disclaimer.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'invalid_json', 'Request body must be JSON.');
  }

  const parsed = parseOr400(SimulationInputSchema, body);
  if (!parsed.ok) return parsed.response;

  const bundle = getBundle();
  const unknownTargets = parsed.value.modifications
    .map((m) => m.target)
    .filter((t) => !bundle.indexes.knownNodeIds.has(t));

  if (unknownTargets.length > 0) {
    return apiError(
      400,
      'unknown_target',
      `No such node in the curated graph: ${unknownTargets.join(', ')}.`,
    );
  }

  try {
    // serializeSimulation is the only exit point; it throws rather than
    // sanitising, because a result that needed sanitising is an engine bug.
    const output = serializeSimulation(runSimulation(bundle, parsed.value));
    return NextResponse.json(
      {
        data: output,
        meta: { content_version: bundle.contentVersion, disclaimer: output.disclaimer },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('Simulation refused by safety serialization:', err);
    return apiError(500, 'simulation_failed', 'The simulation could not be produced safely.');
  }
}
