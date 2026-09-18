import type { Direction } from '@schemas/index';
import { NO_COMPARABLE_REASON_TEXT, type CompareResult } from '@/domain/compare/engine';
import { ScientificStatement } from '@/components/safety/ScientificStatement';
import { UncertaintyNote } from '@/components/evidence/UncertaintyNote';

/**
 * Direction is carried by a word and a glyph, never by an arrow alone, and
 * `tissue_dependent` / `individual_variable` are first-class answers — §15's
 * "Mitochondrial function → tissue-dependent changes" must be sayable rather
 * than forced into an up or a down.
 */
const DIRECTION: Record<Direction, { glyph: string; label: string }> = {
  increases: { glyph: '↑', label: 'Higher at the later age' },
  decreases: { glyph: '↓', label: 'Lower at the later age' },
  changes_qualitatively: { glyph: '⇄', label: 'Changes in kind, not in amount' },
  stable: { glyph: '→', label: 'Broadly unchanged' },
  tissue_dependent: { glyph: '⊕', label: 'Depends on the tissue' },
  individual_variable: { glyph: '≈', label: 'Varies between individuals' },
  unclear: { glyph: '?', label: 'Unclear' },
};

export function CompareTable({ result }: { result: CompareResult }) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="mb-3 text-left text-[var(--color-ink-muted)]">
        Age {result.ageA} compared with age {result.ageB}, in the{' '}
        <strong className="text-[var(--color-ink)]">{result.population.label}</strong>. Cells with
        no comparable data say why &mdash; a stated gap is not a finding of no change.
      </caption>
      <thead>
        <tr className="border-b border-[var(--color-line)] text-left">
          <th scope="col" className="py-2 pr-3 font-semibold">
            Dimension
          </th>
          <th scope="col" className="py-2 pr-3 font-semibold">
            Age {result.ageA} &rarr; {result.ageB}
          </th>
          <th scope="col" className="py-2 font-semibold">
            Evidence and uncertainty
          </th>
        </tr>
      </thead>
      <tbody>
        {result.rows.map((row) => (
          <tr key={row.entityId} className="border-b border-[var(--color-line)] align-top">
            <th scope="row" className="py-3 pr-3 text-left font-medium">
              {row.entityName}
            </th>

            <td className="py-3 pr-3">
              {row.cell.kind === 'no_comparable_data' ? (
                <div className="rounded border border-dashed border-[var(--color-no-data)] px-2 py-1.5">
                  <p className="font-medium">No comparable data</p>
                  <p className="text-[var(--color-ink-muted)]">
                    {NO_COMPARABLE_REASON_TEXT[row.cell.reason]}
                  </p>
                </div>
              ) : row.cell.kind === 'qualitative' ? (
                <ScientificStatement provenance={row.cell.provenance}>
                  <span aria-hidden="true" className="mr-1.5 font-mono">
                    {DIRECTION[row.cell.direction].glyph}
                  </span>
                  <strong>{DIRECTION[row.cell.direction].label}.</strong> {row.cell.statement}
                </ScientificStatement>
              ) : (
                <ScientificStatement provenance={row.cell.provenance}>
                  <span className="font-mono">
                    {row.cell.a} &rarr; {row.cell.b} {row.cell.unit}
                  </span>
                  <span className="ml-1.5 text-[var(--color-ink-muted)]">
                    ({row.cell.delta > 0 ? '+' : ''}
                    {row.cell.delta} {row.cell.unit}, {row.cell.measure})
                  </span>
                </ScientificStatement>
              )}
            </td>

            <td className="py-3">
              {row.cell.kind === 'no_comparable_data' ? (
                <span className="text-[var(--color-ink-muted)]">&mdash;</span>
              ) : (
                <UncertaintyNote provenance={row.cell.provenance} />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
