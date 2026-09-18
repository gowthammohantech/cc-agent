import type { EvidenceLevel, Provenance, ReviewStatus } from '@schemas/index';

/**
 * FR-17, applied in the render path.
 *
 * Two rules here are worth stating plainly, because a stricter-looking version
 * of each would be actively worse:
 *
 * 1. `in_review` content is VISIBLE. The seed corpus ships `in_review`, so
 *    hiding non-approved records would blank the application entirely. It is
 *    shown with a review chip, under the site-wide pending-review banner, which
 *    is honest. Hiding it and shipping an empty app would not be more careful,
 *    just less useful.
 * 2. `hypothesis` and `speculative` are collapsed by default and carry a
 *    mandatory prefix. They are not hidden — §20 requires the product to show
 *    the full evidence spectrum — but they must never sit flush alongside
 *    established human findings, because adjacency reads as equivalence.
 */
export type Visibility = 'normal' | 'collapsed_by_default' | 'hidden';

export interface RenderGate {
  visibility: Visibility;
  /** Rendered before the claim itself. Never optional when present. */
  prefix: string | null;
  /** Species or provenance chip the UI must show alongside the claim. */
  chip: string | null;
  requiresExpansion: boolean;
}

const HIDDEN_IN_PRODUCTION: readonly ReviewStatus[] = ['draft', 'needs_revision', 'retired'];

export function gateFor(
  level: EvidenceLevel,
  review: ReviewStatus,
  opts: { isProduction?: boolean } = {},
): RenderGate {
  const isProduction = opts.isProduction ?? process.env.NODE_ENV === 'production';

  if (HIDDEN_IN_PRODUCTION.includes(review)) {
    return isProduction
      ? { visibility: 'hidden', prefix: null, chip: null, requiresExpansion: false }
      : {
          visibility: 'normal',
          prefix: `${review.replace('_', ' ').toUpperCase()} — not reviewed`,
          chip: 'Not for publication',
          requiresExpansion: false,
        };
  }

  const reviewChip = review === 'in_review' ? 'Pending review' : null;

  switch (level) {
    case 'hypothesis':
      return {
        visibility: 'collapsed_by_default',
        prefix: 'Hypothesis — not demonstrated',
        chip: reviewChip,
        requiresExpansion: true,
      };
    case 'speculative':
      return {
        visibility: 'collapsed_by_default',
        prefix: 'Speculative — no supporting evidence yet',
        chip: reviewChip,
        requiresExpansion: true,
      };
    case 'animal':
      return {
        visibility: 'normal',
        prefix: null,
        chip: 'Animal studies',
        requiresExpansion: false,
      };
    case 'in_vitro':
      return {
        visibility: 'normal',
        prefix: null,
        chip: 'Cells / in vitro',
        requiresExpansion: false,
      };
    default:
      return { visibility: 'normal', prefix: null, chip: reviewChip, requiresExpansion: false };
  }
}

export function gateForProvenance(p: Provenance, opts?: { isProduction?: boolean }): RenderGate {
  return gateFor(p.evidence_level, p.review_status, opts ?? {});
}

/** Correlational claims must never be phrased as causal in the UI. */
export function causalQualifier(p: Provenance): string | null {
  switch (p.causal_status) {
    case 'correlational_only':
      return 'Association only — this has not been shown to be causal.';
    case 'disputed':
      return 'Disputed — sources conflict on this.';
    case 'proposed':
      return 'Proposed — a suggested explanation, not a demonstrated one.';
    case 'unknown':
      return 'Causal standing unknown.';
    default:
      return null;
  }
}
