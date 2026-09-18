import type { Metadata } from 'next';
import {
  CAUSAL_STATUS_LABEL,
  CausalStatus,
  EVIDENCE_DIMENSION_LABEL,
  EVIDENCE_DIMENSION_KEYS,
  EVIDENCE_LEVEL_LABEL,
  EvidenceLevel,
} from '@schemas/index';

export const metadata: Metadata = {
  title: 'Evidence model',
  description: 'How AgeLens grades evidence, and why it refuses to reduce it to a single score.',
};

export default function EvidenceModelPage() {
  return (
    <article className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Evidence model</h1>

      <section aria-labelledby="levels-heading" className="space-y-2">
        <h2 id="levels-heading" className="text-lg font-semibold">
          Seven evidence levels
        </h2>
        <p className="text-[var(--color-ink-muted)]">
          Every claim is labelled with one of these, ordered strongest to weakest. They describe
          where a finding comes from, not how interesting it is.
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-[var(--color-ink-muted)]">
          {EvidenceLevel.options.map((level) => (
            <li key={level}>{EVIDENCE_LEVEL_LABEL[level]}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="causal-heading" className="space-y-2">
        <h2 id="causal-heading" className="text-lg font-semibold">
          Causal standing is recorded separately
        </h2>
        <p className="text-[var(--color-ink-muted)]">
          Strength of evidence and causal standing are different questions, so they are different
          fields. A finding can rest on large, consistent human data and still be correlational only
          &mdash; which is the case for several of the best-known associations in this field.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-[var(--color-ink-muted)]">
          {CausalStatus.options.map((status) => (
            <li key={status}>{CAUSAL_STATUS_LABEL[status]}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dimensions-heading" className="space-y-2">
        <h2 id="dimensions-heading" className="text-lg font-semibold">
          Eight independent dimensions, never one score
        </h2>
        <p className="text-[var(--color-ink-muted)]">
          Each hallmark carries an evidence profile judged across eight dimensions. They are
          deliberately not combined. A single number would be more convenient and would destroy the
          information that makes the profile useful &mdash; a finding can have excellent study
          design and no clinical relevance, and averaging those hides exactly the tension a reader
          needs to see.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-[var(--color-ink-muted)]">
          {EVIDENCE_DIMENSION_KEYS.map((key) => (
            <li key={key}>{EVIDENCE_DIMENSION_LABEL[key]}</li>
          ))}
        </ul>
        <p className="text-[var(--color-ink-muted)]">
          The overall label on a badge is written by a person and justified in words. It is not
          computed from the dimensions, and a test asserts that weakening every dimension does not
          change it.
        </p>
      </section>

      <section aria-labelledby="gating-heading" className="space-y-2">
        <h2 id="gating-heading" className="text-lg font-semibold">
          How weak evidence is displayed
        </h2>
        <p className="text-[var(--color-ink-muted)]">
          Hypothetical and speculative claims are collapsed behind a label rather than hidden. The
          full spectrum has to remain visible, but sitting flush beside an established human finding
          would read as equivalence. Animal and cell-culture findings always carry a species chip.
        </p>
      </section>
    </article>
  );
}
