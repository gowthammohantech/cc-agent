import { assertNoBannedPatterns } from '@/domain/safety/guards';
import type { SimulationOutput } from './types';

/** Keys that would imply a magnitude or a personal age estimate. */
const FORBIDDEN_KEY =
  /(^|_)(biological_age|age_estimate|score|percent|magnitude|years_younger)($|_)/i;

function forbiddenKeysIn(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => forbiddenKeysIn(v, `${path}[${i}]`));
  if (value === null || typeof value !== 'object') return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, v]) => {
    const here = path ? `${path}.${key}` : key;
    return [...(FORBIDDEN_KEY.test(key) ? [here] : []), ...forbiddenKeysIn(v, here)];
  });
}

/**
 * The single exit point for simulation results.
 *
 * The POST handler calls nothing else, so there is no code path that emits a
 * simulation payload without passing these checks. They throw rather than
 * sanitise: a result that needed sanitising is a bug in the engine, and
 * quietly repairing it would hide that.
 */
export function serializeSimulation(output: SimulationOutput): SimulationOutput {
  if (!output.disclaimer.includes('NOT A CLINICAL PREDICTION')) {
    throw new Error('SAFETY: simulation output is missing the §21 disclaimer.');
  }
  if (output.whole_organism_claim !== 'not_supported') {
    throw new Error('SAFETY: simulation output asserts a whole-organism claim.');
  }
  if (output.not_a_clinical_prediction !== true) {
    throw new Error('SAFETY: simulation output dropped its clinical-prediction flag.');
  }

  const forbidden = forbiddenKeysIn(output);
  if (forbidden.length > 0) {
    throw new Error(
      `SAFETY: simulation output contains forbidden field(s): ${forbidden.join(', ')}`,
    );
  }

  assertNoBannedPatterns('simulation output', JSON.stringify(output));
  return output;
}
