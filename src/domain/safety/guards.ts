import type { Provenance } from '@schemas/index';
import { scanText } from './banned-patterns';

/**
 * Runtime backstop for the schema rule. The schema already refuses to parse an
 * uncited claim, so reaching this in production would mean a record was
 * constructed in code rather than loaded from content — which is itself the
 * bug worth surfacing.
 */
export function assertCited(where: string, provenance: Provenance): void {
  if (provenance.citations.length === 0) {
    throw new Error(`SAFETY: ${where} renders a scientific claim with no citation.`);
  }
  if (provenance.uncertainty.description.trim().length < 10) {
    throw new Error(`SAFETY: ${where} renders a scientific claim with no stated uncertainty.`);
  }
}

/** Throws if any prohibited claim pattern appears in text about to be emitted. */
export function assertNoBannedPatterns(where: string, text: string): void {
  const hits = scanText(where, text);
  if (hits.length > 0) {
    const detail = hits.map((h) => `${h.patternId}: "${h.excerpt}"`).join('; ');
    throw new Error(`SAFETY: prohibited claim in ${where} — ${detail}`);
  }
}
