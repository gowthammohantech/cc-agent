import type { Metadata } from 'next';
import Link from 'next/link';
import { getBundle } from '@/content/bundle';

export const metadata: Metadata = {
  title: 'Limitations',
  description: 'What AgeLens cannot tell you, and where its current content is thin.',
};

export default function LimitationsPage() {
  const bundle = getBundle();

  return (
    <article className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Limitations</h1>
      <p className="text-[var(--color-ink-muted)]">
        Written plainly, because a tool that presents scientific uncertainty should be candid about
        its own.
      </p>

      <section aria-labelledby="cannot-heading" className="space-y-2">
        <h2 id="cannot-heading" className="text-lg font-semibold">
          What this cannot tell you
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[var(--color-ink-muted)]">
          <li>
            Anything about <strong>you</strong>. There is no personal assessment here, no biological
            age estimate, and no field in which one could be returned.
          </li>
          <li>
            Whether any intervention would help. Research approaches are described to explain what
            is being studied, never to recommend.
          </li>
          <li>
            Whether human aging can be reversed. Where reversal has been shown, this states in what
            system and in which species &mdash; almost always in animals.
          </li>
          <li>
            What causes what. Many links are labelled correlational, and those never propagate in
            the simulation.
          </li>
        </ul>
      </section>

      <section aria-labelledby="thin-heading" className="space-y-2">
        <h2 id="thin-heading" className="text-lg font-semibold">
          Where the content is currently thin
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[var(--color-ink-muted)]">
          <li>
            <strong>No numeric trajectories.</strong> There are {bundle.trajectories.length} curated
            trajectories, so every chart-shaped question renders as a stated gap. A trajectory needs
            individually cited data points, and none could be verified against its source in this
            build environment.
          </li>
          <li>
            <strong>One population.</strong> Everything uses a composite general adult population.
            For bone density and several other measures the sex difference is large and well
            documented, so this framing is inadequate; the affected records say so themselves.
          </li>
          <li>
            <strong>Unverified identifiers.</strong> Source DOIs were transcribed from well-known
            references and not resolved against a registry.
          </li>
          <li>
            <strong>No expert review.</strong> All {bundle.observations.length} observations and{' '}
            {bundle.relationships.length} relationships are marked &ldquo;in review&rdquo;.
          </li>
          <li>
            <strong>Uneven coverage.</strong> Some organ systems have no observations at all. The
            interface names them rather than leaving blank panels, because an empty panel reads as
            &ldquo;nothing changes here&rdquo;.
          </li>
        </ul>
      </section>

      <section aria-labelledby="body-heading" className="space-y-2">
        <h2 id="body-heading" className="text-lg font-semibold">
          The body view is a diagram, not anatomy
        </h2>
        <p className="text-[var(--color-ink-muted)]">
          The figure is built from geometric primitives because no licensed anatomical model was
          available. Shapes are simplified and positions are indicative. It should not be used as an
          anatomy reference, which is why every body view says so on screen.
        </p>
      </section>

      <p className="text-sm">
        <Link href="/about/methodology" className="underline">
          How content is authored and reviewed
        </Link>
      </p>
    </article>
  );
}
