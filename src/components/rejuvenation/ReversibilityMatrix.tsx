import type { RejuvenationTarget, Tri } from '@schemas/index';

/**
 * BO-06 made visible: reversibility is tracked per species and never merged.
 *
 * A single "reversible: yes" column would be the most misleading thing this
 * application could contain, because almost everything here is demonstrated in
 * mice and almost nothing in people.
 */
const TRI_DISPLAY: Record<Tri, { glyph: string; label: string }> = {
  yes: { glyph: '●', label: 'Demonstrated' },
  partial: { glyph: '◐', label: 'Partly demonstrated' },
  no: { glyph: '○', label: 'Not demonstrated' },
  unknown: { glyph: '?', label: 'Unknown' },
};

export function ReversibilityMatrix({ targets }: { targets: readonly RejuvenationTarget[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="mb-2 text-left text-[var(--color-ink-muted)]">
        Where reversal has actually been demonstrated, by species. Cells state the level of
        demonstration in words &mdash; a result in mice is not a result in people.
      </caption>
      <thead>
        <tr className="border-b border-[var(--color-line)] text-left">
          <th scope="col" className="py-2 pr-3 font-semibold">
            Target
          </th>
          <th scope="col" className="py-2 pr-3 font-semibold">
            In cells
          </th>
          <th scope="col" className="py-2 pr-3 font-semibold">
            In animals
          </th>
          <th scope="col" className="py-2 font-semibold">
            In humans
          </th>
        </tr>
      </thead>
      <tbody>
        {targets.map((t) => {
          const r = t.reversibility_demonstrated;
          return (
            <tr key={t.target_id} className="border-b border-[var(--color-line)] align-top">
              <th scope="row" className="py-2 pr-3 text-left font-medium">
                {t.name}
              </th>
              {([r.in_vitro, r.in_animals, r.in_humans] as const).map((value, i) => (
                <td key={i} className="py-2 pr-3">
                  <span aria-hidden="true" className="mr-1.5 font-mono">
                    {TRI_DISPLAY[value].glyph}
                  </span>
                  {TRI_DISPLAY[value].label}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
