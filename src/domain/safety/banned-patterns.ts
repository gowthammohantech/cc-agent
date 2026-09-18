/**
 * FR-17 — prohibited claim patterns.
 *
 * These are scanned across BOTH the scientific content files and the
 * application source, by `scripts/check-banned-claims.ts` (wired into `build`)
 * and by `tests/content/banned-claims.test.ts`.
 *
 * The point is not to catch a careless developer typing "cures aging". It is
 * that the product's central risk — drifting from "here is what the evidence
 * shows" toward "here is what will make you younger" — happens one sentence at
 * a time, and a sentence is exactly the unit a regex can hold the line on.
 */
export interface BannedPattern {
  readonly id: string;
  readonly pattern: RegExp;
  readonly rationale: string;
}

export const BANNED_PATTERNS: readonly BannedPattern[] = [
  {
    id: 'biological_age_assertion',
    pattern: /\byou\s+(?:are|were|'re)\s+now\s+biologically\b/i,
    rationale: '§21 — the product must never tell a person what biological age they now are.',
  },
  {
    id: 'age_number_claim',
    pattern: /\bbiologicall?y\s+\d{1,3}\b/i,
    rationale: '§21 — "biologically 42" is a personal age claim no validated model here supports.',
  },
  {
    id: 'reverses_aging',
    pattern: /\b(?:reverses|reversing|reverse)\s+(?:your\s+)?(?:aging|ageing)\b/i,
    rationale:
      '§49 — "reverse aging" is not a single measurable claim. Allowed only where the product defines and deconstructs the phrase.',
  },
  {
    id: 'cure_claim',
    pattern: /\bcures?\s+(?:aging|ageing)\b/i,
    rationale: 'BO-07 — aging is not presented as a curable disease.',
  },
  {
    id: 'proven_claim',
    pattern: /\b(?:clinically\s+)?proven\s+to\b/i,
    rationale: '§6 Principle 2 — evidence is graded and cited, never asserted as "proven".',
  },
  {
    id: 'dosage',
    pattern: /\b\d+(?:\.\d+)?\s?(?:mg|mcg|µg|ug|iu)\b/i,
    rationale:
      'FR-17 — the product does not prescribe drugs or supplements, so it carries no doses.',
  },
  {
    id: 'recommendation',
    pattern: /\byou\s+should\s+(?:take|use|start|try|supplement)\b/i,
    rationale: 'FR-17 — no treatment or supplement recommendations.',
  },
  {
    id: 'diagnosis',
    pattern: /\byour\s+(?:biological\s+age|risk\s+of|diagnosis)\b/i,
    rationale: 'FR-17 — no personalized diagnosis or risk scoring.',
  },
  {
    id: 'anti_aging_product',
    pattern: /\banti-?aging\s+(?:treatment|therapy|product|solution)\b/i,
    rationale: '§53 — AgeLens is explicitly not an anti-aging treatment product.',
  },
  {
    id: 'miracle_framing',
    pattern: /\b(?:miracle|breakthrough)\s+(?:cure|treatment|therapy)\b/i,
    rationale: '§10 — engagement must never be bought with exaggerated scientific claims.',
  },
];

/**
 * Paths exempt from the scan. §49 requires the product to *quote* phrases like
 * "reverse aging" in order to take them apart; a scanner that forbids the
 * vocabulary of the critique would forbid the critique.
 */
export const ALLOWLIST_PREFIXES: readonly string[] = [
  'content/copy/rejuvenation-definitions.json',
  'src/app/about/',
  'src/domain/safety/banned-patterns.ts',
  'tests/content/banned-claims.test.ts',
  'scripts/check-banned-claims.ts',
];

export interface BannedMatch {
  readonly file: string;
  readonly line: number;
  readonly patternId: string;
  readonly rationale: string;
  readonly excerpt: string;
}

export function isAllowlisted(relPath: string): boolean {
  const normalized = relPath.replaceAll('\\', '/');
  return ALLOWLIST_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/**
 * A negated claim is the opposite of the claim, and the product is required to
 * make several of them verbatim — §53's "AgeLens is not an anti-aging treatment
 * product" is the product statement itself. So a hit immediately preceded by a
 * negator is not a violation.
 *
 * Kept deliberately tight: only an adjacent negator counts, so "this does not
 * work, it reverses aging" is still caught.
 */
const NEGATOR_BEFORE =
  /\b(?:not|never|isn't|aren't|does not|do not|cannot|no)\s+(?:an?\s+|the\s+)?$/i;

function isNegated(prevLine: string, line: string, matchIndex: number): boolean {
  // Prose wraps, and JSX wraps it aggressively, so the negator routinely lands
  // on the previous source line. Look across the boundary.
  const before = `${prevLine} ${line.slice(0, matchIndex)}`.replace(/\s+/g, ' ');
  return NEGATOR_BEFORE.test(before);
}

/** Scan one file's text, returning every banned-pattern hit with its line number. */
export function scanText(relPath: string, text: string): BannedMatch[] {
  if (isAllowlisted(relPath)) return [];

  const matches: BannedMatch[] = [];
  const lines = text.split('\n');

  lines.forEach((line, i) => {
    for (const bp of BANNED_PATTERNS) {
      const m = bp.pattern.exec(line);
      if (m && !isNegated(lines[i - 1] ?? '', line, m.index)) {
        matches.push({
          file: relPath,
          line: i + 1,
          patternId: bp.id,
          rationale: bp.rationale,
          excerpt: line.trim().slice(0, 160),
        });
      }
    }
  });

  return matches;
}
