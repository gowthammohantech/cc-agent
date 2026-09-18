import type { Provenance } from '@schemas/index';
import { gateForProvenance } from '@/domain/safety/gating';

/**
 * Every scientific claim in the UI goes through here, so the evidence gate
 * cannot be forgotten. The custom ESLint rule `local/require-evidence-prop`
 * makes rendering this without provenance a lint error.
 */
export function ScientificStatement({
  children,
  provenance,
  className,
}: {
  children: React.ReactNode;
  provenance: Provenance;
  className?: string;
}) {
  const gate = gateForProvenance(provenance);
  if (gate.visibility === 'hidden') return null;

  const body = (
    <>
      {gate.prefix && (
        <strong className="mr-1.5 rounded bg-[var(--color-surface-sunken)] px-1.5 py-0.5 text-xs tracking-wide uppercase">
          {gate.prefix}
        </strong>
      )}
      {gate.chip && (
        <span className="mr-1.5 rounded border border-[var(--color-line)] px-1.5 py-0.5 text-xs">
          {gate.chip}
        </span>
      )}
      {children}
    </>
  );

  // Hypothesis and speculative claims are collapsed rather than hidden: §20
  // requires the whole evidence spectrum to stay visible, but sitting flush
  // beside an established human finding would read as equivalence.
  if (gate.visibility === 'collapsed_by_default') {
    return (
      <details className={className}>
        <summary className="cursor-pointer text-sm">
          <span className="rounded bg-[var(--color-surface-sunken)] px-1.5 py-0.5 text-xs tracking-wide uppercase">
            {gate.prefix}
          </span>
          <span className="ml-2 text-[var(--color-ink-muted)]">Show this claim</span>
        </summary>
        <div className="mt-2">{children}</div>
      </details>
    );
  }

  return <div className={className}>{body}</div>;
}
