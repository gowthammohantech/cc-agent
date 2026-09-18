import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'coverage',
  'out',
  'test-results',
  'playwright-report',
]);

/** Recursively list files under `dir` whose name matches one of `extensions`. */
export function walkFiles(root: string, dir: string, extensions: readonly string[]): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }

  for (const entry of entries.sort()) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkFiles(root, full, extensions));
    } else if (extensions.some((e) => entry.endsWith(e))) {
      out.push(relative(root, full).replaceAll('\\', '/'));
    }
  }
  return out;
}
