'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { AgeBand, BiologicalEntity } from '@schemas/index';
import { ENTITY_LAYER_LABEL } from '@schemas/index';
import { useAppStore } from '@/state/store';
import { selectAgeSnapshot } from '@/state/selectors';
import { AgeSlider } from '@/components/age/AgeSlider';
import { EntityDetail } from './EntityDetail';

/**
 * The zoom page keeps its own slider so the age stays adjustable at every
 * level — moving from organ to cell should not cost you the age you were
 * looking at, and adjusting the age should not cost you your place in the
 * hierarchy.
 */
export function EntityZoomWorkspace({
  entity,
  bands,
  ancestorNames,
  hallmarks,
}: {
  entity: BiologicalEntity;
  bands: readonly AgeBand[];
  ancestorNames: readonly string[];
  hallmarks: ReadonlyArray<{ id: string; name: string }>;
}) {
  const age = useAppStore((s) => s.age);
  const populationId = useAppStore((s) => s.populationId);
  const snapshot = useMemo(() => selectAgeSnapshot(age, populationId), [age, populationId]);

  const observations = useMemo(
    () => snapshot.overview.observations.filter((o) => o.entity_id === entity.id),
    [snapshot, entity.id],
  );

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">{entity.name}</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {ENTITY_LAYER_LABEL[entity.layer]}
          {ancestorNames.length > 0 && <> &middot; within {ancestorNames.join(' → ')}</>}
        </p>
        <p className="mt-2 text-[var(--color-ink-muted)]">{entity.description}</p>
      </header>

      <section
        aria-label="Age selection"
        className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4"
      >
        <AgeSlider bands={bands} />
      </section>

      <EntityDetail entity={entity} age={age} observations={observations} />

      {hallmarks.length > 0 && (
        <section aria-labelledby="hm-heading" className="text-sm">
          <h2 id="hm-heading" className="font-semibold">
            Hallmarks associated with {entity.name.toLowerCase()}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {hallmarks.map((h) => (
              <li key={h.id}>
                <Link
                  href={`/hallmarks/${h.id}`}
                  className="inline-block rounded border border-[var(--color-line)] px-2 py-1 hover:border-[var(--color-accent)]"
                >
                  {h.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
