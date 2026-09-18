'use client';

import Link from 'next/link';
import type { ZoomStep } from '@/domain/entities/traverse';

/**
 * §16's BODY → SYSTEM → ORGAN → TISSUE → CELL → ORGANELLE → PATHWAY ladder.
 *
 * The age selection is deliberately untouched as the reader moves along it:
 * §8's whole point is that you can move vertically through biological scale
 * while holding one age fixed, and losing the age at each step would make that
 * impossible to follow.
 */
export function ZoomLadder({
  steps,
  childrenOfCurrent,
}: {
  steps: readonly ZoomStep[];
  childrenOfCurrent: ReadonlyArray<{ id: string; name: string; layerLabel: string }>;
}) {
  const current = steps.at(-1);

  return (
    <nav aria-label="Biological zoom" className="space-y-3">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        {steps.map((step, i) => {
          const isCurrent = i === steps.length - 1;
          return (
            <li key={step.entity.id} className="flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-[var(--color-ink-muted)]">
                  &darr;
                </span>
              )}
              {isCurrent ? (
                <span aria-current="step" className="font-semibold">
                  {step.entity.name}
                  <span className="ml-1 text-xs font-normal text-[var(--color-ink-muted)]">
                    {step.layerLabel}
                  </span>
                </span>
              ) : (
                <Link href={`/body/${step.entity.id}`} className="underline">
                  {step.entity.name}
                  <span className="ml-1 text-xs text-[var(--color-ink-muted)]">
                    {step.layerLabel}
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {childrenOfCurrent.length > 0 && (
        <div className="text-sm">
          <h2 className="text-xs font-semibold tracking-wide text-[var(--color-ink-muted)] uppercase">
            Zoom further into {current?.entity.name.toLowerCase()}
          </h2>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {childrenOfCurrent.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/body/${child.id}`}
                  className="inline-block rounded border border-[var(--color-line)] px-2 py-1 hover:border-[var(--color-accent)]"
                >
                  {child.name}
                  <span className="ml-1.5 text-xs text-[var(--color-ink-muted)]">
                    {child.layerLabel}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
