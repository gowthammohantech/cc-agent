'use client';

import { useMemo } from 'react';
import type { AgeBand, BiologicalEntity, BodyLayout, EvidenceLevel } from '@schemas/index';
import { useAppStore } from '@/state/store';
import { selectAgeSnapshot } from '@/state/selectors';
import type { HighlightSpec } from '@/three/renderer/BodyRenderer';
import { AgeSlider } from '@/components/age/AgeSlider';
import { BodyView } from './BodyView';
import type { TreeNode } from './BodyTree';
import { EntityDetail } from './EntityDetail';

/**
 * Pattern carries evidence strength and colour only reinforces it, so the
 * highlight remains readable in greyscale (§46). Density increases with the
 * strength of the evidence behind the observation.
 */
const PATTERN_FOR_LEVEL: Record<EvidenceLevel, HighlightSpec['pattern']> = {
  human_established: 'solid',
  human_clinical: 'cross-hatch',
  human_observational: 'hatch',
  animal: 'cross-hatch',
  in_vitro: 'dots',
  hypothesis: 'sparse-dots',
  speculative: 'sparse-dots',
};

const COLOR_FOR_LEVEL: Record<EvidenceLevel, string> = {
  human_established: 'var(--color-ev-human-established)',
  human_clinical: 'var(--color-ev-human-clinical)',
  human_observational: 'var(--color-ev-human-observational)',
  animal: 'var(--color-ev-animal)',
  in_vitro: 'var(--color-ev-in-vitro)',
  hypothesis: 'var(--color-ev-hypothesis)',
  speculative: 'var(--color-ev-speculative)',
};

export function BodyWorkspace({
  layout,
  tree,
  entities,
  systems,
  bands,
}: {
  layout: BodyLayout;
  tree: readonly TreeNode[];
  entities: readonly BiologicalEntity[];
  systems: readonly BiologicalEntity[];
  bands: readonly AgeBand[];
}) {
  const age = useAppStore((s) => s.age);
  const populationId = useAppStore((s) => s.populationId);
  const selectedEntityId = useAppStore((s) => s.selectedEntityId);

  const snapshot = useMemo(() => selectAgeSnapshot(age, populationId), [age, populationId]);
  const entityById = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);

  const observationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of snapshot.overview.observations) {
      counts.set(o.entity_id, (counts.get(o.entity_id) ?? 0) + 1);
    }
    return counts;
  }, [snapshot]);

  const highlights = useMemo(() => {
    const drawable = new Set(layout.parts.map((p) => p.entity_id));
    const map = new Map<string, HighlightSpec>();

    let n = 1;
    for (const o of snapshot.overview.observations) {
      if (!drawable.has(o.entity_id) || map.has(o.entity_id)) continue;
      const entity = entityById.get(o.entity_id);
      if (!entity) continue;

      map.set(o.entity_id, {
        calloutNumber: n++,
        label: entity.name,
        pattern: PATTERN_FOR_LEVEL[o.provenance.evidence_level],
        colorToken: COLOR_FOR_LEVEL[o.provenance.evidence_level],
        description: o.observation,
      });
    }
    return map;
  }, [snapshot, layout, entityById]);

  const selected = selectedEntityId ? entityById.get(selectedEntityId) : undefined;

  return (
    <div className="space-y-6">
      <section
        aria-label="Age selection"
        className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4"
      >
        <AgeSlider bands={bands} />
      </section>

      <BodyView
        layout={layout}
        tree={tree}
        entityById={entityById}
        observationCounts={observationCounts}
        highlights={highlights}
        systems={systems}
      />

      {selected && (
        <EntityDetail
          entity={selected}
          age={age}
          observations={snapshot.overview.observations.filter((o) => o.entity_id === selected.id)}
        />
      )}
    </div>
  );
}
