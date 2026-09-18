'use client';

import { useId, useState } from 'react';
import type { Subgraph } from '@/domain/graph/graph';
import { CausalGraph } from './CausalGraph';
import { GraphTextView } from './GraphTextView';

/**
 * The diagram and the list are two views of the same data, switchable by
 * anyone. The list is not a fallback — it carries more detail than the drawing
 * does, so offering it to every reader is simply better.
 */
export function GraphPanel({
  subgraph,
  focusId,
  direction,
  heading,
}: {
  subgraph: Subgraph;
  focusId: string;
  direction: 'in' | 'out';
  heading: string;
}) {
  const [view, setView] = useState<'diagram' | 'list'>('diagram');
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-semibold">
          {heading}
        </h2>

        <fieldset className="flex items-center gap-2 text-sm">
          <legend className="sr-only">View style for {heading}</legend>
          {(['diagram', 'list'] as const).map((option) => (
            <label key={option} className="flex items-center gap-1 py-1">
              <input
                type="radio"
                name={`view-${headingId}`}
                checked={view === option}
                onChange={() => setView(option)}
              />
              {option === 'diagram' ? 'Diagram' : 'List'}
            </label>
          ))}
        </fieldset>
      </div>

      {view === 'diagram' && subgraph.edges.length > 0 ? (
        <CausalGraph subgraph={subgraph} focusId={focusId} direction={direction} />
      ) : (
        <GraphTextView subgraph={subgraph} focusId={focusId} direction={direction} />
      )}

      {view === 'diagram' && subgraph.edges.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-[var(--color-ink-muted)]">
            Read these {subgraph.edges.length} relationships as text, with evidence and uncertainty
          </summary>
          <div className="mt-2">
            <GraphTextView subgraph={subgraph} focusId={focusId} direction={direction} />
          </div>
        </details>
      )}
    </section>
  );
}
