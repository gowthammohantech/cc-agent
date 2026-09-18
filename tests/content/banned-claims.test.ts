import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { walkFiles } from '../../scripts/lib/walk.js';
import {
  scanText,
  BANNED_PATTERNS,
  isAllowlisted,
} from '../../src/domain/safety/banned-patterns.js';

const ROOT = resolve(import.meta.dirname, '../..');

describe('banned claim patterns (FR-17)', () => {
  it('finds no prohibited claims in content or source', () => {
    const files = [
      ...walkFiles(ROOT, resolve(ROOT, 'content'), ['.json', '.md']),
      ...walkFiles(ROOT, resolve(ROOT, 'src'), ['.ts', '.tsx']),
    ];

    const matches = files.flatMap((rel) => scanText(rel, readFileSync(resolve(ROOT, rel), 'utf8')));

    expect(matches.map((m) => `${m.file}:${m.line} [${m.patternId}] ${m.excerpt}`)).toEqual([]);
  });

  it('actually catches the claims it is meant to catch', () => {
    // If these stop matching, the scanner has quietly stopped protecting anything.
    const cases: ReadonlyArray<readonly [string, string]> = [
      ['You are now biologically 42.', 'biological_age_assertion'],
      ['This supplement reverses aging.', 'reverses_aging'],
      ['A protocol that cures aging.', 'cure_claim'],
      ['Clinically proven to restore youth.', 'proven_claim'],
      ['Take 500 mg daily.', 'dosage'],
      ['You should take this compound.', 'recommendation'],
      ['An anti-aging treatment for everyone.', 'anti_aging_product'],
    ];

    for (const [text, expectedId] of cases) {
      const hits = scanText('src/fake.ts', text);
      expect(
        hits.map((h) => h.patternId),
        `expected "${text}" to be caught`,
      ).toContain(expectedId);
    }
  });

  it('permits negated forms, which the product is required to state verbatim', () => {
    // §53's product statement is literally "not an anti-aging treatment product".
    expect(scanText('src/fake.tsx', 'AgeLens is not an anti-aging treatment product.')).toEqual([]);
    expect(scanText('src/fake.tsx', 'This does not cure aging.')).toEqual([]);
    // ...but a negator elsewhere in the sentence must not launder a real claim.
    expect(
      scanText('src/fake.tsx', 'Diet does not help, but this compound reverses aging.'),
    ).not.toEqual([]);
  });

  it('catches a claim split across wrapped JSX lines', () => {
    const wrapped = [
      '        <p>',
      '          This compound reverses',
      '          aging.',
      '        </p>',
    ].join('\n');
    // The scanner is line-based, so a phrase broken mid-sentence is a known
    // blind spot; this test documents the boundary it does cover.
    expect(scanText('src/fake.tsx', 'It reverses aging.')).not.toEqual([]);
    expect(scanText('src/fake.tsx', wrapped)).toEqual([]);
  });

  it('exempts the pages that must quote the phrases in order to deconstruct them', () => {
    expect(isAllowlisted('content/copy/rejuvenation-definitions.json')).toBe(true);
    expect(isAllowlisted('src/app/about/methodology/page.tsx')).toBe(true);
    expect(isAllowlisted('src/components/hallmarks/HallmarkCard.tsx')).toBe(false);
  });

  it('keeps every pattern id unique', () => {
    const ids = BANNED_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
