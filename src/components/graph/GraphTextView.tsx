import Link from 'next/link';
import { RELATIONSHIP_LABEL, CAUSAL_STATUS_LABEL, EVIDENCE_LEVEL_LABEL } from '@schemas/index';
import type { Subgraph } from '@/domain/graph/graph';
import { CAUSAL_EDGE_STYLE } from '@/domain/graph/edgeSemantics';

/**
 * The same subgraph as a nested list.
 *
 * This is the accessible equivalent of the diagram, not a degraded version of
 * it: every edge carries its relationship, its causal standing in words and its
 * evidence level, which is strictly more than the drawing conveys. It is always
 * available via a toggle rather than being reserved for assistive technology.
 */
export function GraphTextView({
  subgraph,
  focusId,
  direction,
}: {
  subgraph: Subgraph;
  focusId: string;
  direction: 'in' | 'out' | 'both';
}) {
  const nameOf = (id: string) => subgraph.nodes.find((n) => n.id === id)?.name ?? id;

  if (subgraph.edges.length === 0) {
    return (
      <p className="rounded border border-dashed border-[var(--color-no-data)] p-3 text-sm text-[var(--color-ink-muted)]">
        No curated relationships {direction === 'in' ? 'into' : 'from'} {nameOf(focusId)}. That is a
        gap in this corpus, not a finding that none exist.
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {subgraph.edges.map((edge) => {
        const style = CAUSAL_EDGE_STYLE[edge.provenance.causal_status];
        return (
          <li key={edge.relationship_id} className="rounded border border-[var(--color-line)] p-3">
            <p>
              {/* The causal standing is a word first; the line style in the
                  diagram merely echoes it. */}
              <strong>{style.textPrefix}</strong>{' '}
              <Link href={`/why/${edge.from_node}`} className="underline">
                {nameOf(edge.from_node)}
              </Link>{' '}
              <em>{RELATIONSHIP_LABEL[edge.relationship]}</em>{' '}
              <Link href={`/why/${edge.to_node}`} className="underline">
                {nameOf(edge.to_node)}
              </Link>
            </p>

            {edge.mechanism_note && (
              <p className="mt-1 text-[var(--color-ink-muted)]">{edge.mechanism_note}</p>
            )}

            <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-ink-muted)]">
              <span>Evidence: {EVIDENCE_LEVEL_LABEL[edge.provenance.evidence_level]}</span>
              <span>Causal standing: {CAUSAL_STATUS_LABEL[edge.provenance.causal_status]}</span>
              <span>Confidence: {edge.provenance.confidence.replace('_', ' ')}</span>
              {edge.age_context && (
                <span>
                  Applies at ages {edge.age_context.age_min}&ndash;{edge.age_context.age_max}
                </span>
              )}
            </p>

            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {edge.provenance.uncertainty.description}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
