import type { AgeOverview } from '@/domain/timeline/engine';

/**
 * FR-01's "expose missing data", rendered.
 *
 * Without this the page would show twelve systems, four of them simply blank,
 * which reads as "nothing changes in these". Naming the gap turns it back into
 * what it is: nobody has curated them yet.
 */
export function CoverageNote({ overview }: { overview: AgeOverview }) {
  const missing = overview.coverage.entitiesWithoutData;
  const band = overview.band;

  return (
    <section
      aria-label="Data coverage at this age"
      className="rounded-lg border border-[var(--color-line)] p-4 text-sm"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-semibold">
          {band ? band.label : 'Outside the curated age bands'}
          {band ? ` (${band.age_min}–${band.age_max})` : ''}
        </h2>
        <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5 text-xs">
          Population: {overview.population.label}
        </span>
        <span className="text-[var(--color-ink-muted)]">
          {overview.coverage.observed} curated observation
          {overview.coverage.observed === 1 ? '' : 's'} at age {overview.age}
        </span>
      </div>

      {band && <p className="mt-2 text-[var(--color-ink-muted)]">{band.description}</p>}

      {band?.data_sparsity_note && (
        <p className="mt-2 rounded border border-dashed border-[var(--color-no-data)] px-2 py-1 text-[var(--color-ink-muted)]">
          {band.data_sparsity_note}
        </p>
      )}

      {missing.length > 0 && (
        <p className="mt-2 text-[var(--color-ink-muted)]">
          <strong className="text-[var(--color-ink)]">No curated data at this age for: </strong>
          {missing.map((id) => id.replace(/_/g, ' ')).join(', ')}. That is a gap in this corpus, not
          a finding that these systems are unchanged.
        </p>
      )}
    </section>
  );
}
