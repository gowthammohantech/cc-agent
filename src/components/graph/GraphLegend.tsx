import { CausalStatus, CAUSAL_STATUS_LABEL } from '@schemas/index';
import { CAUSAL_EDGE_STYLE } from '@/domain/graph/edgeSemantics';

/** Causal standing is shown by line style plus words, never colour (§46). */
export function GraphLegend() {
  return (
    <section aria-labelledby="graph-legend-heading" className="text-sm">
      <h3 id="graph-legend-heading" className="font-semibold">
        How to read the edges
      </h3>
      <ul className="mt-1.5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {CausalStatus.options.map((status) => {
          const style = CAUSAL_EDGE_STYLE[status];
          return (
            <li key={status} className="flex items-center gap-2">
              <svg width="42" height="10" aria-hidden="true" className="shrink-0">
                <line
                  x1="2"
                  y1="5"
                  x2="40"
                  y2="5"
                  stroke="currentColor"
                  strokeWidth="2"
                  {...(style.dashArray ? { strokeDasharray: style.dashArray } : {})}
                />
                {style.marker === 'dot' && <circle cx="21" cy="5" r="2.5" fill="currentColor" />}
                {style.marker === 'hatch' && (
                  <path d="M18,1 L24,9 M21,1 L27,9" stroke="currentColor" strokeWidth="1.5" />
                )}
              </svg>
              <span>
                {CAUSAL_STATUS_LABEL[status]}
                {style.marker === 'question' && <span aria-hidden="true"> ?</span>}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
        A correlational edge is drawn dotted and labelled &ldquo;Correlation only&rdquo;. It does
        not mean one thing causes the other, and it never propagates in the simulation.
      </p>
    </section>
  );
}
