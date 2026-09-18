import type { RejuvenationDefinitions } from '@schemas/index';

/**
 * §49, rendered in full and ordered weakest to strongest.
 *
 * This panel is the reason the rest of the page can be read safely. Every
 * definition states what it does NOT mean, because the characteristic failure
 * in this field is a result satisfying one of the first six categories being
 * reported as though it satisfied the seventh.
 */
export function DefinitionsPanel({ definitions }: { definitions: RejuvenationDefinitions }) {
  return (
    <section
      aria-labelledby="definitions-heading"
      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4"
    >
      <h2 id="definitions-heading" className="text-lg font-semibold">
        Seven different claims, routinely confused
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-[var(--color-ink-muted)]">{definitions.preamble}</p>

      <ol className="mt-4 space-y-3">
        {definitions.definitions.map((d, i) => (
          <li
            key={d.scope}
            className="rounded border border-[var(--color-line)] p-3 text-sm"
            style={{
              // Strength of claim is conveyed by an indent and a number as well
              // as by position, so the ordering survives being read aloud.
              marginInlineStart: `${i * 0.35}rem`,
            }}
          >
            <h3 className="font-medium">
              <span className="mr-1.5 text-[var(--color-ink-muted)]">{i + 1}.</span>
              {d.name}
            </h3>
            <p className="mt-1 text-[var(--color-ink-muted)]">{d.definition}</p>
            <p className="mt-1.5">
              <strong className="text-[var(--color-ink)]">What it does not mean: </strong>
              <span className="text-[var(--color-ink-muted)]">{d.what_it_does_not_mean}</span>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
