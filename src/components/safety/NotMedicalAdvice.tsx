/**
 * Rendered by the /rejuvenation and /simulate layouts (FR-17): the two places a
 * reader is most likely to mistake research framing for a recommendation.
 */
export function NotMedicalAdvice() {
  return (
    <div
      role="note"
      className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface-sunken)] p-3 text-sm text-[var(--color-ink-muted)]"
    >
      <p>
        <strong className="text-[var(--color-ink)]">Not medical advice.</strong> Nothing here
        recommends, prescribes, or endorses any drug, supplement, dose, or procedure. Research
        approaches are described to explain what is being studied, not to suggest you try them.
      </p>
    </div>
  );
}
