import type { Provenance } from '@schemas/index';
import { CAUSAL_STATUS_LABEL, EVIDENCE_LEVEL_LABEL } from '@schemas/index';
import { gateForProvenance } from '@/domain/safety/gating';

/**
 * A non-interactive evidence chip for records that carry provenance directly
 * rather than a full eight-dimension profile. It still shows the level and the
 * causal standing in words — never a bare colour, never a score.
 */
export function EvidenceBadgeStatic({ provenance }: { provenance: Provenance }) {
  const gate = gateForProvenance(provenance);

  return (
    <p className="flex flex-wrap gap-2 text-xs">
      <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5">
        {EVIDENCE_LEVEL_LABEL[provenance.evidence_level]}
      </span>
      <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5">
        {CAUSAL_STATUS_LABEL[provenance.causal_status]}
      </span>
      {gate.chip && (
        <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5">{gate.chip}</span>
      )}
    </p>
  );
}
