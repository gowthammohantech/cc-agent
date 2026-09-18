import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { walkFiles } from './walk.js';
import { canonicalJson } from './canonicalJson.js';

export const ROOT = resolve(import.meta.dirname, '../..');
export const MANIFEST_PATH = 'content/manifest.json';

export interface ContentFileInfo {
  path: string;
  sha256: string;
  record_count: number;
}

function countRecords(parsed: unknown): number {
  if (parsed === null || typeof parsed !== 'object') return 0;
  const arrays = Object.entries(parsed as Record<string, unknown>)
    .filter(([k]) => !k.startsWith('_'))
    .map(([, v]) => v)
    .filter(Array.isArray);
  if (arrays.length === 0) return 1; // a single-object file, e.g. the simulation model
  return arrays.reduce((n, a) => n + a.length, 0);
}

/** Every content record file, excluding the manifest itself, in sorted order. */
export function listContentFiles(): string[] {
  return walkFiles(ROOT, resolve(ROOT, 'content'), ['.json'])
    .filter((p) => p !== MANIFEST_PATH)
    .sort();
}

export function describeContentFiles(): ContentFileInfo[] {
  return listContentFiles().map((path) => {
    const text = readFileSync(resolve(ROOT, path), 'utf8');
    const parsed: unknown = JSON.parse(text);
    return {
      path,
      sha256: createHash('sha256').update(canonicalJson(parsed), 'utf8').digest('hex'),
      record_count: countRecords(parsed),
    };
  });
}

export function recordsHash(files: ContentFileInfo[]): string {
  const combined = files.map((f) => `${f.path}:${f.sha256}`).join('\n');
  return `sha256:${createHash('sha256').update(combined, 'utf8').digest('hex')}`;
}
