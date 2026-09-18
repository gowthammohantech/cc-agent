/**
 * The single most important rendering rule in this application: an empty region
 * must never look like a zero or a flat line.
 *
 * A blank panel reads as "nothing changes here". This reads as "nobody has
 * curated this yet" — a completely different claim, and the honest one.
 */
export function MissingDataNote({
  what,
  reason,
  nearest,
}: {
  what: string;
  reason?: string;
  nearest?: readonly [number, number] | null;
}) {
  return (
    <div
      role="note"
      className="rounded border border-dashed border-[var(--color-no-data)] bg-[var(--color-surface-sunken)] p-3 text-sm"
    >
      <p className="font-medium">No curated data for {what}.</p>
      {reason && <p className="mt-1 text-[var(--color-ink-muted)]">{reason}</p>}
      {nearest && (
        <p className="mt-1 text-[var(--color-ink-muted)]">
          Nearest ages with data: {nearest[0]} and {nearest[1]}.
        </p>
      )}
      <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
        This is a gap in what has been curated here, not evidence that nothing changes.
      </p>
    </div>
  );
}
