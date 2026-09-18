/**
 * §21's literal wording. Rendered by the /simulate layout rather than the page,
 * so no child route can show a result without it, and an e2e test asserts it is
 * on screen whenever results are.
 */
export function SimulationBanner({ disclaimer }: { disclaimer: string }) {
  return (
    <p
      role="note"
      className="rounded-lg border-2 border-[var(--color-class-age-associated)] bg-[var(--color-surface-sunken)] p-4 text-sm font-medium"
    >
      {disclaimer}
    </p>
  );
}
