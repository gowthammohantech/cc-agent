import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getBundle } from '@/content/bundle';
import { runSimulation } from '@/domain/simulation/engine';
import { SimulationInputSchema } from '@schemas/index';

const b = getBundle();
const GOLDEN_DIR = resolve(import.meta.dirname, 'golden');

/**
 * Golden files, so a change in propagation semantics cannot land unnoticed.
 *
 * Regenerate deliberately with UPDATE_GOLDEN=1, which puts the behavioural
 * change in the diff where a reviewer sees it — the same reason the content
 * manifest is checked in.
 */
const CASES = [
  {
    name: 'reduce-senescence',
    modifications: [{ target: 'cellular_senescence', direction: 'reduce' }],
  },
  {
    name: 'restore-autophagy',
    modifications: [{ target: 'disabled_macroautophagy', direction: 'restore' }],
  },
  { name: 'improve-dysbiosis', modifications: [{ target: 'dysbiosis', direction: 'improve' }] },
  {
    name: 'two-modifications',
    modifications: [
      { target: 'cellular_senescence', direction: 'reduce' },
      { target: 'stem_cell_exhaustion', direction: 'improve' },
    ],
  },
] as const;

describe('simulation golden files', () => {
  for (const testCase of CASES) {
    it(`matches the recorded output for ${testCase.name}`, () => {
      const input = SimulationInputSchema.parse({
        chronological_age: 70,
        reference_age: 30,
        modifications: testCase.modifications,
      });

      const actual = `${JSON.stringify(runSimulation(b, input), null, 2)}\n`;
      const file = resolve(GOLDEN_DIR, `${testCase.name}.json`);

      if (process.env['UPDATE_GOLDEN'] === '1' || !existsSync(file)) {
        writeFileSync(file, actual, 'utf8');
      }

      expect(actual).toBe(readFileSync(file, 'utf8'));
    });
  }

  it('records blocked edges in the golden output, not just successes', () => {
    const golden = JSON.parse(
      readFileSync(resolve(GOLDEN_DIR, 'improve-dysbiosis.json'), 'utf8'),
    ) as { unsupported_relationships: unknown[] };
    // Dysbiosis links out correlationally, so this case must show the model
    // declining to traverse rather than producing an empty result.
    expect(golden.unsupported_relationships.length).toBeGreaterThan(0);
  });
});
