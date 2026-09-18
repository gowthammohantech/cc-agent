import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ManifestSchema } from '@schemas/index';
import {
  describeContentFiles,
  recordsHash,
  ROOT,
  MANIFEST_PATH,
} from '../../scripts/lib/contentFiles.js';

describe('content manifest', () => {
  const manifest = ManifestSchema.parse(
    JSON.parse(readFileSync(resolve(ROOT, MANIFEST_PATH), 'utf8')),
  );

  it('is not stale — every file hash still matches its contents', () => {
    const actual = describeContentFiles();
    const byPath = new Map(manifest.files.map((f) => [f.path, f.sha256]));

    const drifted = actual
      .filter((f) => byPath.get(f.path) !== f.sha256)
      .map((f) => `${f.path} (run 'npm run content:hash')`);

    expect(drifted).toEqual([]);
    expect(actual.map((f) => f.path).sort()).toEqual(manifest.files.map((f) => f.path).sort());
  });

  it('carries a records hash covering the whole corpus', () => {
    expect(manifest.records_hash).toBe(recordsHash(describeContentFiles()));
  });

  it('declares a real content version', () => {
    expect(manifest.content_version).not.toBe('0.0.0');
  });
});
