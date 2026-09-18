/**
 * Regenerates content/manifest.json.
 *
 * A test recomputes these hashes and fails when the manifest is stale, so a
 * content change cannot merge without the version bump appearing in the same
 * diff a reviewer is already reading. That is the whole point: without a CMS,
 * the git history is the audit trail, and it only works if it is complete.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describeContentFiles, recordsHash, ROOT, MANIFEST_PATH } from './lib/contentFiles.js';

function main(): void {
  const full = resolve(ROOT, MANIFEST_PATH);
  const previous = JSON.parse(readFileSync(full, 'utf8')) as {
    content_version?: string;
    generated_at?: string;
  };

  const files = describeContentFiles();
  const manifest = {
    content_version: previous.content_version ?? '0.1.0',
    generated_at: new Date().toISOString().slice(0, 10),
    records_hash: recordsHash(files),
    framework_versions: { hallmarks_of_aging: '2023' },
    files,
  };

  writeFileSync(full, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(
    `content:hash — ${files.length} files, ${files.reduce((n, f) => n + f.record_count, 0)} records, version ${manifest.content_version}`,
  );
}

main();
