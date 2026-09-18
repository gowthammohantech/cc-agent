import type { Metadata } from 'next';
import Link from 'next/link';
import { getBundle } from '@/content/bundle';
import { CONTENT_GENERATED_AT, CONTENT_VERSION } from '@/content/version';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'How AgeLens content is authored, versioned and reviewed — and what that does not cover.',
};

export default function MethodologyPage() {
  const bundle = getBundle();

  return (
    <article className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Methodology</h1>

      <section aria-labelledby="review-heading" className="space-y-2">
        <h2 id="review-heading" className="text-lg font-semibold">
          How content is reviewed
        </h2>
        <p className="text-[var(--color-ink-muted)]">
          AgeLens uses a git-based review process, not a content management system with roles and
          formal sign-off. Scientific records live as versioned JSON in the repository, validated
          against schemas at build time, and every change is a reviewable diff with its history
          preserved. Content files sit behind a code-owner rule so a change cannot merge unreviewed.
        </p>
        <p className="rounded border border-[var(--color-line)] bg-[var(--color-surface-sunken)] p-3">
          <strong>What this does not mean.</strong> It is not equivalent to expert scientific
          review. The current corpus ships with a review status of &ldquo;in review&rdquo;, which
          means exactly what it says: no domain expert has signed it off. Treat every record as a
          starting point to check rather than a settled conclusion.
        </p>
      </section>

      <section aria-labelledby="sources-heading" className="space-y-2">
        <h2 id="sources-heading" className="text-lg font-semibold">
          How sources are handled
        </h2>
        <p className="text-[var(--color-ink-muted)]">
          Every scientific claim carries at least one source and a written statement of its
          uncertainty; a record lacking either cannot be loaded at all. Source identifiers in this
          build were transcribed from well-known references and have <strong>not</strong> been
          resolved against a citation registry, because the build environment has no access to one.
          Each source page and drawer says so rather than leaving the impression they were checked.
        </p>
      </section>

      <section aria-labelledby="numbers-heading" className="space-y-2">
        <h2 id="numbers-heading" className="text-lg font-semibold">
          Why there are so few numbers
        </h2>
        <p className="text-[var(--color-ink-muted)]">
          A figure can only appear here inside a record that names the source reporting it. Where
          that was not possible, the record states the direction of a change in words instead, and
          charts show a labelled gap rather than a line. There are currently no curated numeric
          trajectories at all &mdash; filling charts with plausible-looking curves would be the most
          damaging thing this application could do, because a graph is believed more readily than a
          sentence.
        </p>
      </section>

      <section aria-labelledby="version-heading" className="space-y-2">
        <h2 id="version-heading" className="text-lg font-semibold">
          Versioning
        </h2>
        <p className="text-[var(--color-ink-muted)]">
          This build carries content version <code className="font-mono">{CONTENT_VERSION}</code>,
          generated {CONTENT_GENERATED_AT}. The version appears in the footer and in every API
          response, so a screenshot or a shared link can be traced back to an exact content state.
          It currently holds {bundle.entities.length} biological entities, {bundle.hallmarks.length}{' '}
          hallmarks, {bundle.observations.length} observations, {bundle.relationships.length}{' '}
          relationships and {bundle.studies.length} sources.
        </p>
      </section>

      <p className="text-sm">
        <Link href="/about/limitations" className="underline">
          What this application cannot tell you
        </Link>
      </p>
    </article>
  );
}
