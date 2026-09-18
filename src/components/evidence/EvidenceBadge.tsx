'use client';

import { useId, useState } from 'react';
import type { EvidenceLevel } from '@schemas/index';
import { EVIDENCE_LEVEL_LABEL } from '@schemas/index';
import type { EvidenceBadge as Badge } from '@/domain/evidence/engine';

/**
 * §20's seven levels, distinguished by three channels at once: the level in
 * words, a glyph, and colour last as reinforcement (§46).
 */
const LEVEL_GLYPH: Record<EvidenceLevel, string> = {
  human_established: '●●●',
  human_clinical: '●●◐',
  human_observational: '●●○',
  animal: '●◐○',
  in_vitro: '●○○',
  hypothesis: '◐○○',
  speculative: '○○○',
};

const LEVEL_TOKEN: Record<EvidenceLevel, string> = {
  human_established: 'var(--color-ev-human-established)',
  human_clinical: 'var(--color-ev-human-clinical)',
  human_observational: 'var(--color-ev-human-observational)',
  animal: 'var(--color-ev-animal)',
  in_vitro: 'var(--color-ev-in-vitro)',
  hypothesis: 'var(--color-ev-hypothesis)',
  speculative: 'var(--color-ev-speculative)',
};

export function EvidenceBadge({ badge }: { badge: Badge }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const label = EVIDENCE_LEVEL_LABEL[badge.label];

  return (
    <div className="text-sm">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-2 rounded border border-[var(--color-line)] px-2 py-1 text-left hover:border-[var(--color-accent)]"
      >
        <span
          aria-hidden="true"
          className="font-mono text-xs tracking-tighter"
          style={{ color: LEVEL_TOKEN[badge.label] }}
        >
          {LEVEL_GLYPH[badge.label]}
        </span>
        <span className="font-medium">{label}</span>
        <span aria-hidden="true" className="text-[var(--color-ink-muted)]">
          {expanded ? '−' : '+'}
        </span>
        <span className="sr-only">
          Evidence level: {label}. Expand for the eight-dimension basis.
        </span>
      </button>

      {/*
        §37 — the label never appears without its reasoning being reachable. The
        badge is a button rather than a chip precisely so the eight dimensions
        are one interaction away, and there is no single number to mistake for a
        summary.
      */}
      {expanded && (
        <div
          id={panelId}
          className="mt-2 rounded border border-[var(--color-line)] bg-[var(--color-surface-sunken)] p-3"
        >
          <p className="mb-3 text-[var(--color-ink-muted)]">
            <strong className="text-[var(--color-ink)]">Why this label: </strong>
            {badge.labelBasis}
          </p>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {badge.basis.map((d) => (
              <div key={d.key}>
                <dt className="font-medium">
                  {d.label}: <span className="font-normal">{d.ratingLabel}</span>
                </dt>
                <dd className="text-xs text-[var(--color-ink-muted)]">{d.note}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
            These eight dimensions are judged independently and are deliberately not combined into a
            single score.
          </p>
        </div>
      )}
    </div>
  );
}
