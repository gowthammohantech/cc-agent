/**
 * FR-17 / BO-07. Persistent, non-dismissible, part of the landmark structure —
 * deliberately not a toast, because a toast can be missed or auto-hidden.
 */
export function GlobalDisclaimerBar() {
  return (
    <aside
      aria-label="Important notice about this resource"
      className="border-b border-[var(--color-line)] bg-[var(--color-surface-sunken)] px-4 py-2 text-sm text-[var(--color-ink-muted)]"
    >
      <p className="mx-auto max-w-6xl">
        <strong className="font-semibold text-[var(--color-ink)]">Educational resource.</strong>{' '}
        AgeLens is not medical advice, diagnosis, or treatment, and does not estimate any
        individual&rsquo;s biological age.
      </p>
    </aside>
  );
}
