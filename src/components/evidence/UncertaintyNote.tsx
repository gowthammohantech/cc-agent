import type { Provenance } from '@schemas/index';
import { CAUSAL_STATUS_LABEL } from '@schemas/index';
import { causalQualifier } from '@/domain/safety/gating';

export function UncertaintyNote({ provenance }: { provenance: Provenance }) {
  const qualifier = causalQualifier(provenance);

  return (
    <div className="space-y-1.5 text-sm">
      {qualifier && (
        <p className="rounded border border-[var(--color-line)] bg-[var(--color-surface-sunken)] px-2 py-1 text-[var(--color-ink)]">
          <strong>{CAUSAL_STATUS_LABEL[provenance.causal_status]}.</strong> {qualifier}
        </p>
      )}
      <p className="text-[var(--color-ink-muted)]">
        <strong className="text-[var(--color-ink)]">Uncertainty: </strong>
        {provenance.uncertainty.description}
      </p>
      {provenance.uncertainty.known_conflicts.length > 0 && (
        <div className="text-[var(--color-ink-muted)]">
          <strong className="text-[var(--color-ink)]">Conflicting views:</strong>
          <ul className="mt-0.5 list-disc pl-5">
            {provenance.uncertainty.known_conflicts.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
