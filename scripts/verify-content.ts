/**
 * Content integrity gate (Phase 1 fills this in against the real schemas).
 * Until the seed corpus lands, this reports an empty corpus rather than
 * silently passing, so an empty content tree can never look like a green check.
 */
import { resolve } from 'node:path';
import { walkFiles } from './lib/walk.js';

const ROOT = resolve(import.meta.dirname, '..');

function main(): void {
  const files = walkFiles(ROOT, resolve(ROOT, 'content'), ['.json']);
  const records = files.filter((f) => f !== 'content/manifest.json');
  console.log(
    `verify:content — ${records.length} content file(s) found.` +
      (records.length === 0 ? ' Seed corpus not yet authored (Phase 1).' : ''),
  );
}

main();
