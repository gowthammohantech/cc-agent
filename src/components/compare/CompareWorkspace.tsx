'use client';

import { useMemo } from 'react';
import type { Population } from '@schemas/index';
import { useAppStore, MAX_SLIDER_AGE, MIN_SLIDER_AGE } from '@/state/store';
import { getBundle } from '@/content/bundle';
import { compareAges } from '@/domain/compare/engine';
import { CompareTable } from './CompareTable';

export function CompareWorkspace({ population }: { population: Population }) {
  const ageA = useAppStore((s) => s.compareAgeA);
  const ageB = useAppStore((s) => s.compareAgeB);
  const setCompareAges = useAppStore((s) => s.setCompareAges);

  const result = useMemo(
    () => compareAges(getBundle(), { ageA, ageB, dimensions: [], populationId: population.id }),
    [ageA, ageB, population.id],
  );

  const gaps = result.rows.filter((r) => r.cell.kind === 'no_comparable_data').length;

  return (
    <div className="space-y-5">
      <fieldset className="flex flex-wrap items-end gap-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4">
        <legend className="px-1 text-sm font-medium">Ages to compare</legend>

        {(
          [
            ['compare-age-a', 'First age', ageA, (v: number) => setCompareAges(v, ageB)],
            ['compare-age-b', 'Second age', ageB, (v: number) => setCompareAges(ageA, v)],
          ] as const
        ).map(([id, label, value, onChange]) => (
          <div key={id} className="flex items-center gap-2">
            <label htmlFor={id} className="text-sm">
              {label}
            </label>
            <input
              id={id}
              type="number"
              min={MIN_SLIDER_AGE}
              max={MAX_SLIDER_AGE}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-20 rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1"
            />
          </div>
        ))}
      </fieldset>

      <p className="text-sm text-[var(--color-ink-muted)]">
        {result.rows.length - gaps} of {result.rows.length} dimensions have comparable data.{' '}
        {gaps > 0 && (
          <>
            The remaining {gaps} say why no comparison is possible; this application does not
            subtract across different measures or populations to fill a cell.
          </>
        )}
      </p>

      <CompareTable result={result} />

      <section
        aria-labelledby="pop-caveats"
        className="rounded-lg border border-[var(--color-line)] p-4 text-sm"
      >
        <h2 id="pop-caveats" className="font-semibold">
          About the {population.label.toLowerCase()}
        </h2>
        <p className="mt-1 text-[var(--color-ink-muted)]">{population.cohort_note}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--color-ink-muted)]">
          {population.caveats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
