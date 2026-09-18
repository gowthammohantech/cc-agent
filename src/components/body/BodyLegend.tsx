import type { HighlightSpec } from '@/three/renderer/BodyRenderer';

/**
 * The numbered legend the callouts point at.
 *
 * This is what makes §46 hold in the body view: every highlighted structure is
 * identified by a number and named in text here, so the diagram remains
 * readable with no colour perception at all.
 */
export function BodyLegend({ highlights }: { highlights: ReadonlyMap<string, HighlightSpec> }) {
  const items = [...highlights.values()].sort((a, b) => a.calloutNumber - b.calloutNumber);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="body-legend-heading" className="text-sm">
      <h3 id="body-legend-heading" className="font-semibold">
        Highlighted at this age
      </h3>
      <ol className="mt-1.5 space-y-1">
        {items.map((h) => (
          <li key={h.calloutNumber} className="flex gap-2">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] text-xs font-semibold"
            >
              {h.calloutNumber}
            </span>
            <span>
              <strong>{h.label}</strong>{' '}
              <span className="text-[var(--color-ink-muted)]">{h.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
