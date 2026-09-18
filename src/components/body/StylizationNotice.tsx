/**
 * Persistent and non-dismissible on every body view.
 *
 * The figure is built from geometric primitives because no licensed anatomical
 * model is available here. Left unlabelled, a smooth 3D body implies a
 * precision this drawing does not have — which is the same overclaim FR-17
 * prohibits in text, made visually instead.
 */
export function StylizationNotice({ notice }: { notice: string }) {
  return (
    <p
      role="note"
      className="rounded border border-dashed border-[var(--color-line)] bg-[var(--color-surface-sunken)] px-2 py-1.5 text-xs text-[var(--color-ink-muted)]"
    >
      {notice}
    </p>
  );
}
