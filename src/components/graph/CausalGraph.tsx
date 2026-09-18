'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RELATIONSHIP_LABEL } from '@schemas/index';
import type { Subgraph } from '@/domain/graph/graph';
import { layoutSubgraph } from '@/domain/graph/layout';
import { CAUSAL_EDGE_STYLE } from '@/domain/graph/edgeSemantics';

/**
 * Nodes are real buttons inside the SVG's foreignObject-free layout, reachable
 * by Tab and activatable by Enter, so the diagram is navigable rather than
 * being a picture with a text alternative bolted on.
 */
export function CausalGraph({
  subgraph,
  focusId,
  direction,
}: {
  subgraph: Subgraph;
  focusId: string;
  direction: 'in' | 'out';
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const layout = useMemo(
    () => layoutSubgraph(subgraph, focusId, direction),
    [subgraph, focusId, direction],
  );
  const positionOf = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);

  if (subgraph.edges.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-2">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        width={layout.width}
        height={layout.height}
        role="group"
        aria-label={`Diagram of ${subgraph.edges.length} relationships. The same information is listed below as text.`}
        className="max-w-none"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
          </marker>
        </defs>

        {subgraph.edges.map((edge) => {
          const from = positionOf.get(edge.from_node);
          const to = positionOf.get(edge.to_node);
          if (!from || !to) return null;
          const style = CAUSAL_EDGE_STYLE[edge.provenance.causal_status];
          const active = hovered === edge.from_node || hovered === edge.to_node;

          return (
            <g key={edge.relationship_id} className="text-[var(--color-ink-muted)]">
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="currentColor"
                strokeWidth={active ? 2.5 : 1.4}
                {...(style.dashArray ? { strokeDasharray: style.dashArray } : {})}
                markerEnd="url(#arrow)"
              />
              <title>
                {`${style.textPrefix} ${from.name} ${RELATIONSHIP_LABEL[edge.relationship]} ${to.name}`}
              </title>
            </g>
          );
        })}

        {layout.nodes.map((node) => {
          const isFocus = node.id === focusId;
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                x={-86}
                y={-20}
                width={172}
                height={40}
                rx={6}
                fill="var(--color-surface)"
                stroke={isFocus ? 'var(--color-accent)' : 'var(--color-line)'}
                strokeWidth={isFocus ? 2.5 : 1.2}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fontSize="12"
                fill="var(--color-ink)"
                className="pointer-events-none"
              >
                {node.name.length > 24 ? `${node.name.slice(0, 22)}…` : node.name}
              </text>
              <rect
                x={-86}
                y={-20}
                width={172}
                height={40}
                rx={6}
                fill="transparent"
                tabIndex={0}
                role="link"
                aria-label={`${node.name}${isFocus ? ', current focus' : ''}. Open its causal view.`}
                className="cursor-pointer outline-offset-2"
                onClick={() => router.push(`/why/${node.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/why/${node.id}`);
                  }
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
