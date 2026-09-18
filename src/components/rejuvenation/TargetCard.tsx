import Link from 'next/link';
import { REJUVENATION_SCOPE_LABEL, type RejuvenationTarget } from '@schemas/index';
import { EvidenceBadgeStatic } from '@/components/evidence/EvidenceBadgeStatic';

export function TargetCard({ target }: { target: RejuvenationTarget }) {
  return (
    <article
      aria-labelledby={`target-${target.target_id}`}
      className="flex h-full flex-col gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4"
    >
      <header>
        <h3 id={`target-${target.target_id}`} className="font-semibold">
          <Link
            href={`/rejuvenation/targets/${target.target_id}`}
            className="inline-block py-1 hover:underline"
          >
            {target.name}
          </Link>
        </h3>
        <p className="mt-1 flex flex-wrap gap-2 text-xs">
          <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5">
            {REJUVENATION_SCOPE_LABEL[target.rejuvenation_scope]}
          </span>
          <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5">
            {target.clinical_status.replace(/_/g, ' ')}
          </span>
        </p>
      </header>

      <p className="text-sm text-[var(--color-ink-muted)]">{target.desired_direction}</p>

      <EvidenceBadgeStatic provenance={target.provenance} />

      {/*
        Risks and unknowns are on the card, not behind a link. The schema
        guarantees both exist; showing them at the summary level is what stops
        a grid of targets reading as a list of things that work.
      */}
      <div className="mt-auto space-y-2 border-t border-[var(--color-line)] pt-3 text-sm">
        <div>
          <h4 className="text-xs font-semibold tracking-wide text-[var(--color-ink-muted)] uppercase">
            Risks ({target.risks.length})
          </h4>
          <p className="mt-0.5 text-[var(--color-ink-muted)]">{target.risks[0]?.risk}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold tracking-wide text-[var(--color-ink-muted)] uppercase">
            Unknowns ({target.unknowns.length})
          </h4>
          <p className="mt-0.5 text-[var(--color-ink-muted)]">{target.unknowns[0]}</p>
        </div>
      </div>
    </article>
  );
}
