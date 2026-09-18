import type { Metadata } from 'next';
import { getBundle } from '@/content/bundle';
import { getTargets } from '@/domain/rejuvenation/engine';
import { DefinitionsPanel } from '@/components/rejuvenation/DefinitionsPanel';
import { ReversibilityMatrix } from '@/components/rejuvenation/ReversibilityMatrix';
import { TargetCard } from '@/components/rejuvenation/TargetCard';

export const metadata: Metadata = {
  title: 'Explore Rejuvenation',
  description:
    'What would biologically have to change for a younger functional state, and how strongly has each change been demonstrated?',
};

export default function RejuvenationPage() {
  const bundle = getBundle();
  const targets = getTargets(bundle);

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Explore rejuvenation</h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          This mode reverses the question, not the biology. For each age-associated change: what
          would have to improve, repair, reset or regenerate &mdash; what is actually being
          researched &mdash; and how strongly has any of it been demonstrated, in which species?
        </p>
      </header>

      {/*
        §19. Rendered before the targets, not after: a list of targets reads as
        a checklist of solvable problems unless this is said first.
      */}
      <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-sunken)] p-4 text-sm">
        <strong>{bundle.disclaimers.systemic_caveat}</strong>
      </p>

      <DefinitionsPanel definitions={bundle.rejuvenationDefinitions} />

      <section aria-labelledby="targets-heading" className="space-y-4">
        <div>
          <h2 id="targets-heading" className="text-lg font-semibold">
            Candidate targets
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Every target carries at least one stated risk and one stated unknown, because a target
            without either is an endorsement rather than a record.
          </p>
        </div>

        <ul className="grid gap-4 md:grid-cols-2">
          {targets.map((t) => (
            <li key={t.target_id}>
              <TargetCard target={t} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="reversibility-heading" className="space-y-3">
        <h2 id="reversibility-heading" className="text-lg font-semibold">
          Where reversal has been demonstrated
        </h2>
        <ReversibilityMatrix targets={targets} />
      </section>
    </div>
  );
}
