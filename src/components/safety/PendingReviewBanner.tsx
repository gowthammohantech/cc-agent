/**
 * Required by the project's review posture: the seed scientific corpus ships as
 * `in_review` and has not yet been signed off by a domain reviewer. The content
 * is visible — hiding it would make the app useless — but it must never be
 * presented as carrying a scientific review it has not had.
 */
export function PendingReviewBanner() {
  return (
    <aside
      aria-label="Content review status"
      className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm"
    >
      <p className="mx-auto max-w-6xl text-[var(--color-ink-muted)]">
        <span
          className="mr-2 inline-block rounded border border-[var(--color-line)] px-1.5 py-0.5 text-xs font-semibold tracking-wide text-[var(--color-ink)] uppercase"
          aria-hidden="true"
        >
          In review
        </span>
        Scientific records in this build are <strong>pending expert review</strong>. Each record
        carries its own sources, evidence level and stated uncertainty &mdash; check them before
        relying on anything here.{' '}
        <a className="underline" href="/about/methodology">
          How content is reviewed
        </a>
        .
      </p>
    </aside>
  );
}
