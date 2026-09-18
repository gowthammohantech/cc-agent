/**
 * FR-17 enforcement, layer 1: fail the build on prohibited claim phrasing.
 *
 * Scans every scientific content file and every application source file. Run by
 * `npm run verify:claims`, which `npm run build` depends on.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { walkFiles } from './lib/walk.js';
import { scanText, type BannedMatch } from '../src/domain/safety/banned-patterns.js';

const ROOT = resolve(import.meta.dirname, '..');

function main(): void {
  const files = [
    ...walkFiles(ROOT, resolve(ROOT, 'content'), ['.json', '.md']),
    ...walkFiles(ROOT, resolve(ROOT, 'src'), ['.ts', '.tsx']),
  ];

  const matches: BannedMatch[] = [];
  for (const rel of files) {
    const text = readFileSync(resolve(ROOT, rel), 'utf8');
    matches.push(...scanText(rel, text));
  }

  if (matches.length === 0) {
    console.log(`verify:claims — scanned ${files.length} files, no prohibited claims found.`);
    return;
  }

  console.error(`\nverify:claims FAILED — ${matches.length} prohibited claim(s):\n`);
  for (const m of matches) {
    console.error(`  ${m.file}:${m.line}  [${m.patternId}]`);
    console.error(`    ${m.excerpt}`);
    console.error(`    why: ${m.rationale}\n`);
  }
  process.exit(1);
}

main();
