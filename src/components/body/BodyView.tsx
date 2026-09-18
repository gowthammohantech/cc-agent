'use client';

import { useMemo } from 'react';
import type { BiologicalEntity, BodyLayout } from '@schemas/index';
import { useAppStore } from '@/state/store';
import {
  RENDERER_CAPABILITIES,
  RENDERER_LABEL,
  type HighlightSpec,
} from '@/three/renderer/BodyRenderer';
import { useResolvedRenderer, usePrefersReducedMotion } from '@/three/renderer/useRenderer';
import { SvgBodyRenderer } from './SvgBodyRenderer';
import { ThreeBodyRenderer } from './ThreeBodyRenderer';
import { BodyTree, type TreeNode } from './BodyTree';
import { StylizationNotice } from './StylizationNotice';
import { SystemPicker } from './SystemPicker';
import { BodyLegend } from './BodyLegend';

export function BodyView({
  layout,
  tree,
  entityById,
  observationCounts,
  highlights,
  systems,
}: {
  layout: BodyLayout;
  tree: readonly TreeNode[];
  entityById: ReadonlyMap<string, BiologicalEntity>;
  observationCounts: ReadonlyMap<string, number>;
  highlights: ReadonlyMap<string, HighlightSpec>;
  systems: readonly BiologicalEntity[];
}) {
  const preference = useAppStore((s) => s.rendererPreference);
  const setPreference = useAppStore((s) => s.setRendererPreference);
  const selectedEntityId = useAppStore((s) => s.selectedEntityId);
  const hoveredEntityId = useAppStore((s) => s.hoveredEntityId);
  const selectedSystemId = useAppStore((s) => s.selectedSystemId);
  const select = useAppStore((s) => s.select);
  const hover = useAppStore((s) => s.hover);
  const selectSystem = useAppStore((s) => s.selectSystem);

  // The server has no window, so this resolves to the SVG diagram and the view
  // is never an empty box while the client decides.
  const resolved = useResolvedRenderer(preference);
  const reducedMotion = usePrefersReducedMotion();

  const selectedEntity = selectedEntityId ? entityById.get(selectedEntityId) : undefined;
  const announcement = useMemo(() => {
    if (!selectedEntity) return '';
    const count = observationCounts.get(selectedEntity.id) ?? 0;
    return `Selected: ${selectedEntity.name}. ${
      count > 0
        ? `${count} curated observation${count === 1 ? '' : 's'}.`
        : 'No curated observations at this age.'
    }`;
  }, [selectedEntity, observationCounts]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SystemPicker systems={systems} selectedId={selectedSystemId} onSelect={selectSystem} />

        {/*
          The fallback is a user choice, not only a failure state: someone who
          finds the 3D view unhelpful can pick the diagram or the list outright.
        */}
        <fieldset className="flex items-center gap-2 text-sm">
          <legend className="sr-only">Body view style</legend>
          <span className="text-[var(--color-ink-muted)]">View:</span>
          {(['auto', 'three', 'svg', 'dom'] as const).map((option) => (
            <label key={option} className="flex items-center gap-1 py-1">
              <input
                type="radio"
                name="renderer"
                value={option}
                checked={preference === option}
                onChange={() => setPreference(option)}
              />
              {option === 'auto' ? 'Auto' : RENDERER_LABEL[option]}
            </label>
          ))}
        </fieldset>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-2">
          {resolved === 'dom' ? (
            <p className="rounded border border-[var(--color-line)] p-3 text-sm text-[var(--color-ink-muted)]">
              Showing the structure list only. The diagram and 3D views present the same entities.
            </p>
          ) : (
            <>
              {resolved === 'three' ? (
                <ThreeBodyRenderer
                  layout={layout}
                  selectedSystemId={selectedSystemId}
                  selectedEntityId={selectedEntityId}
                  hoveredEntityId={hoveredEntityId}
                  highlights={highlights}
                  reducedMotion={reducedMotion}
                  onSelect={select}
                  onHover={hover}
                />
              ) : (
                <SvgBodyRenderer
                  layout={layout}
                  selectedSystemId={selectedSystemId}
                  selectedEntityId={selectedEntityId}
                  highlights={highlights}
                  onSelect={select}
                  onHover={hover}
                />
              )}
              {!RENDERER_CAPABILITIES[resolved].rotate && (
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Static diagram &mdash; this view does not rotate.
                </p>
              )}
            </>
          )}
          <StylizationNotice notice={layout.stylization_notice} />
        </div>

        <div className="space-y-3">
          <BodyTree
            roots={tree}
            selectedId={selectedEntityId}
            onSelect={select}
            observationCounts={observationCounts}
          />
          <BodyLegend highlights={highlights} />
        </div>
      </div>

      {/* Selection is announced, because the canvas itself is aria-hidden. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
