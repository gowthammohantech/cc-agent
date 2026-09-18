import type { CitationRef, EvidenceLevel, EvidenceProfile, Study } from '@schemas/index';
import {
  EVIDENCE_DIMENSION_KEYS,
  EVIDENCE_DIMENSION_LABEL,
  RATING_LABEL,
  type EvidenceDimensionKey,
  type Rating,
} from '@schemas/index';
import type { ContentBundle } from '@/content/bundle';

export interface ResolvedCitation {
  ref: CitationRef;
  study: Study | null;
}

export function getStudy(bundle: ContentBundle, sourceId: string): Study | null {
  return bundle.indexes.studyById.get(sourceId) ?? null;
}

export function resolveCitations(
  bundle: ContentBundle,
  refs: readonly CitationRef[],
): ResolvedCitation[] {
  return refs.map((ref) => ({ ref, study: getStudy(bundle, ref.source_id) }));
}

export function getProfile(bundle: ContentBundle, profileId: string): EvidenceProfile | null {
  return bundle.indexes.profileById.get(profileId) ?? null;
}

export interface EvidenceDimensionSummary {
  key: EvidenceDimensionKey;
  label: string;
  rating: Rating;
  ratingLabel: string;
  note: string;
  citations: readonly CitationRef[];
}

export interface EvidenceBadge {
  label: EvidenceLevel;
  basis: readonly EvidenceDimensionSummary[];
  labelBasis: string;
}

/**
 * FR-10 / §37.
 *
 * This function returns the AUTHORED label together with all eight dimensions.
 * It is deliberately not a reduction: nothing here averages, scores, or ranks
 * the dimensions into the label, and a unit test asserts that changing the
 * dimension ratings does not change the label.
 *
 * The reason is that collapsing eight independent judgements into one number is
 * the specific failure §37 names, and it is also the most tempting refactor
 * anyone will ever propose for this file. Returning `basis` alongside `label`
 * means a badge physically cannot render without its justification available.
 */
export function badgeFor(profile: EvidenceProfile): EvidenceBadge {
  return {
    label: profile.overall_label,
    labelBasis: profile.label_basis,
    basis: EVIDENCE_DIMENSION_KEYS.map((key) => {
      const dim = profile.dimensions[key];
      return {
        key,
        label: EVIDENCE_DIMENSION_LABEL[key],
        rating: dim.rating,
        ratingLabel: RATING_LABEL[dim.rating],
        note: dim.note,
        citations: dim.citations,
      };
    }),
  };
}

export type StalenessFlag = 'current' | 'aging' | 'stale';

export interface Staleness {
  yearsSinceCheck: number;
  flag: StalenessFlag;
  description: string;
}

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

/**
 * FR-17 — "flag outdated evidence".
 *
 * Measured from `last_checked_at`, not publication year: a 1961 paper someone
 * verified this year is in better standing than a 2023 paper nobody has looked
 * at since. Evidence rot is silent, so it has to be surfaced deliberately.
 */
export function stalenessOf(study: Study, now: Date = new Date()): Staleness {
  const years = (now.getTime() - new Date(study.last_checked_at).getTime()) / YEAR_MS;
  const flag: StalenessFlag = years > 5 ? 'stale' : years > 3 ? 'aging' : 'current';

  return {
    yearsSinceCheck: years,
    flag,
    description:
      flag === 'stale'
        ? 'Not re-checked in over five years; treat with caution.'
        : flag === 'aging'
          ? 'Not re-checked in over three years.'
          : 'Checked recently.',
  };
}
