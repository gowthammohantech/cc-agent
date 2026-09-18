'use client';

import { useMemo } from 'react';
import type { AgeBand, EvidenceProfile } from '@schemas/index';
import { useAppStore } from '@/state/store';
import { selectAgeSnapshot } from '@/state/selectors';
import { badgeFor } from '@/domain/evidence/engine';
import { AgeSlider } from './AgeSlider';
import { HallmarkGrid } from '@/components/hallmarks/HallmarkGrid';
import { CoverageNote } from './CoverageNote';

/**
 * The slider-critical content is bundled into the client, so moving the slider
 * performs no network request at all (§43). The FR-15 routes exist for deep
 * links and as the seam for a future database; both call the same engines.
 */
export function AgeWorkspace({
  bands,
  profiles,
}: {
  bands: readonly AgeBand[];
  profiles: Readonly<Record<string, EvidenceProfile>>;
}) {
  const age = useAppStore((s) => s.age);
  const populationId = useAppStore((s) => s.populationId);

  const snapshot = useMemo(() => selectAgeSnapshot(age, populationId), [age, populationId]);

  const items = useMemo(
    () =>
      snapshot.hallmarks.map((state) => {
        const profile = profiles[state.hallmark.evidence_profile_id];
        return { state, badge: profile ? badgeFor(profile) : null };
      }),
    [snapshot, profiles],
  );

  return (
    <div className="space-y-8">
      <section
        aria-label="Age selection"
        className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4"
      >
        <AgeSlider bands={bands} />
      </section>

      <CoverageNote overview={snapshot.overview} />

      <section aria-labelledby="hallmarks-heading" className="space-y-4">
        <div>
          <h2 id="hallmarks-heading" className="text-xl font-semibold">
            Hallmarks at age {age}
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Twelve commonly discussed hallmarks of aging. Each card shows what this corpus documents
            at the selected age, the evidence behind it, and what remains uncertain.
          </p>
        </div>
        <HallmarkGrid items={items} age={age} />
      </section>
    </div>
  );
}
