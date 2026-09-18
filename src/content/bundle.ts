import { loadRawContent, type RawContent } from './load';
import { buildIndexes, type ContentIndexes } from './indexes';
import { buildAgeIndex, type AgeIndex } from '@/domain/timeline/ageIndex';
import { CONTENT_VERSION } from './version';

export interface ContentBundle extends RawContent {
  indexes: ContentIndexes;
  ageIndex: AgeIndex;
  contentVersion: string;
}

let cached: ContentBundle | null = null;

/**
 * Module-level singleton. The corpus is immutable for the life of the process,
 * so parsing and index construction happen once; every engine call is then a
 * lookup rather than a parse, which is what keeps the age slider inside its
 * sub-100ms budget without any network access.
 */
export function getBundle(): ContentBundle {
  if (cached) return cached;
  const raw = loadRawContent();
  const indexes = buildIndexes(raw);
  cached = Object.freeze({
    ...raw,
    indexes,
    ageIndex: buildAgeIndex(raw),
    contentVersion: CONTENT_VERSION,
  });
  return cached;
}

/** Test-only: drop the cache so a fixture bundle can replace it. */
export function resetBundleForTests(): void {
  cached = null;
}
