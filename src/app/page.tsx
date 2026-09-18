import Link from 'next/link';
import type { Route } from 'next';

/** §11.1 — the six primary entry actions. */
const ACTIONS: ReadonlyArray<{ href: Route; title: string; blurb: string }> = [
  {
    href: '/aging',
    title: 'Explore Aging',
    blurb:
      'Move an age slider from birth to late life and watch what is documented to change — with the evidence behind each change.',
  },
  {
    href: '/rejuvenation',
    title: 'Explore Rejuvenation',
    blurb:
      'What would biologically have to change for a younger functional state, and how strongly has each change been demonstrated?',
  },
  {
    href: '/body',
    title: 'Explore Human Body',
    blurb:
      'Move from organism to system, organ, tissue, cell, organelle and pathway while staying at one selected age.',
  },
  {
    href: '/hallmarks',
    title: 'Explore Hallmarks',
    blurb:
      'Twelve commonly discussed hallmarks of aging, each with its trajectory, relationships, uncertainty and sources.',
  },
  {
    href: '/compare',
    title: 'Compare Ages',
    blurb:
      'Put two ages side by side across biological dimensions, with population context and honest gaps where data do not exist.',
  },
  {
    href: '/library',
    title: 'Research Library',
    blurb:
      'Every source behind every statement: study type, species, population, sample size, limitations and review date.',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Human Aging &amp; Rejuvenation Explorer
        </h1>
        <p className="text-lg text-[var(--color-ink-muted)]">
          Aging is not one process. AgeLens connects what changes across the body with why it may
          change, what is modifiable, what has actually been reversed and where, and what remains
          unresolved &mdash; keeping human, animal, cell-culture and hypothetical evidence visibly
          separate.
        </p>
      </header>

      <nav aria-label="Primary explorations">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="block h-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4 transition-colors hover:border-[var(--color-accent)]"
              >
                <h2 className="font-semibold">{a.title}</h2>
                <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">{a.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section
        aria-labelledby="scope-heading"
        className="max-w-3xl rounded-lg border border-[var(--color-line)] p-4"
      >
        <h2 id="scope-heading" className="font-semibold">
          What this is not
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          <li>Not a diagnosis, treatment, or supplement recommendation.</li>
          <li>
            Not a personal biological-age estimate &mdash; AgeLens never scores an individual.
          </li>
          <li>
            Not a claim that whole-body human aging can currently be safely reversed. Where reversal
            has been shown, AgeLens states in what system and in which species.
          </li>
        </ul>
      </section>
    </div>
  );
}
