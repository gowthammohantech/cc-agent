'use client';

import { useMemo } from 'react';
import type { BodyLayout } from '@schemas/index';
import { instancesOf, partsForSystem, type HighlightSpec } from '@/three/renderer/BodyRenderer';
import { projectPart, viewBoxFor } from '@/three/geometry/project';

/**
 * A 2D projection of the same body-layout.json the 3D scene uses.
 *
 * It is both the reduced-motion / no-WebGL fallback and the instant placeholder
 * while the three.js chunk loads, so the body view is never a blank rectangle.
 */
const PATTERN_ID: Record<HighlightSpec['pattern'], string> = {
  solid: 'pat-solid',
  hatch: 'pat-hatch',
  'cross-hatch': 'pat-cross',
  dots: 'pat-dots',
  'sparse-dots': 'pat-sparse',
};

export function SvgBodyRenderer({
  layout,
  selectedSystemId,
  selectedEntityId,
  highlights,
  onSelect,
  onHover,
}: {
  layout: BodyLayout;
  selectedSystemId: string | null;
  selectedEntityId: string | null;
  highlights: ReadonlyMap<string, HighlightSpec>;
  onSelect: (entityId: string) => void;
  onHover: (entityId: string | null) => void;
}) {
  const view = useMemo(() => viewBoxFor(layout.figure_height), [layout.figure_height]);
  const parts = useMemo(() => partsForSystem(layout, selectedSystemId), [layout, selectedSystemId]);

  return (
    <svg
      viewBox={`0 0 ${view.width} ${view.height}`}
      className="h-auto w-full max-w-[20rem]"
      role="img"
      aria-label={`Stylized front view of a human figure showing ${
        selectedSystemId ? selectedSystemId.replace(/_/g, ' ') : 'all systems'
      }. Structures are simplified shapes, not anatomical forms. Use the body structure tree beside this diagram to explore and select.`}
    >
      <defs>
        <pattern id={PATTERN_ID.hatch} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0,6 l6,-6" stroke="currentColor" strokeWidth="1.2" />
        </pattern>
        <pattern id={PATTERN_ID['cross-hatch']} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0,6 l6,-6 M-1,1 l2,-2 M5,7 l2,-2" stroke="currentColor" strokeWidth="1" />
          <path d="M0,0 l6,6" stroke="currentColor" strokeWidth="1" />
        </pattern>
        <pattern id={PATTERN_ID.dots} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.1" fill="currentColor" />
        </pattern>
        <pattern id={PATTERN_ID['sparse-dots']} width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="1" fill="currentColor" />
        </pattern>
      </defs>

      {/* Translucent body shell, so organ layers inside stay visible. */}
      <g opacity={0.16} aria-hidden="true">
        {layout.shell.flatMap((part) =>
          instancesOf(part).map((instance) => {
            const p = projectPart(instance.part, instance.side, view);
            return p.path ? null : (
              <ellipse
                key={instance.key}
                cx={p.cx}
                cy={p.cy}
                rx={p.rx}
                ry={p.ry}
                transform={`rotate(${p.rotationDeg} ${p.cx} ${p.cy})`}
                fill="var(--color-ink)"
              />
            );
          }),
        )}
      </g>

      {parts.flatMap((part) =>
        instancesOf(part).map((instance) => {
          const p = projectPart(instance.part, instance.side, view);
          const highlight = highlights.get(part.entity_id);
          const isSelected = selectedEntityId === part.entity_id;
          const fill = highlight ? `url(#${PATTERN_ID[highlight.pattern]})` : 'var(--color-accent)';
          const color = highlight?.colorToken ?? 'var(--color-accent)';

          const shared = {
            style: { color },
            fill,
            fillOpacity: highlight ? 1 : 0.55,
            stroke: isSelected ? 'var(--color-ink)' : color,
            strokeWidth: isSelected ? 2.5 : 1,
            className: 'cursor-pointer',
            onClick: () => onSelect(part.entity_id),
            onMouseEnter: () => onHover(part.entity_id),
            onMouseLeave: () => onHover(null),
          };

          return p.path ? (
            <path key={instance.key} d={p.path} {...shared} fill="none" strokeWidth={p.rx * 2} />
          ) : (
            <ellipse
              key={instance.key}
              cx={p.cx}
              cy={p.cy}
              rx={p.rx}
              ry={p.ry}
              transform={`rotate(${p.rotationDeg} ${p.cx} ${p.cy})`}
              {...shared}
            />
          );
        }),
      )}

      {/* Numbered callouts matching the DOM legend — state is never colour alone. */}
      {[...highlights.entries()].map(([entityId, spec]) => {
        const part = parts.find((p) => p.entity_id === entityId);
        if (!part) return null;
        const p = projectPart(part, 1, view);
        return (
          <g key={`callout-${entityId}`} aria-hidden="true">
            <circle
              cx={p.cx}
              cy={p.cy}
              r={8}
              fill="var(--color-surface-raised)"
              stroke="var(--color-ink)"
            />
            <text
              x={p.cx}
              y={p.cy + 3.5}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-ink)"
              fontWeight="600"
            >
              {spec.calloutNumber}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
