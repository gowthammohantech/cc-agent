import type { Metadata } from 'next';
import { getBundle } from '@/content/bundle';
import { SimulateWorkspace } from '@/components/simulate/SimulateWorkspace';
import { DefinitionsPanel } from '@/components/rejuvenation/DefinitionsPanel';

export const metadata: Metadata = {
  title: 'Reverse Simulation',
  description:
    'Trace hypothetical changes through the curated relationship graph. Educational simulation; not a clinical prediction.',
};

export default function SimulatePage() {
  const bundle = getBundle();

  /*
   * Every one of the twelve hallmarks names a DYSFUNCTION — instability,
   * attrition, exhaustion, dysregulation. The edge signs in model-v1.json
   * encode quantity semantics (DAMAGES is -1 because *more* of the damager
   * means worse function downstream), so a hypothetical improvement is always
   * a REDUCTION in the quantity of the named dysfunction.
   *
   * Seeding these as 'improve' inverts every chain: it reads as "more altered
   * intercellular communication", and the trace then correctly reports things
   * getting worse. The labels say "Reduce" because that is what the model is
   * actually being asked.
   */
  const choices = bundle.hallmarks
    .filter((h) => (bundle.indexes.outgoing.get(h.id) ?? []).length > 0)
    .map((h) => ({ id: h.id, name: h.name, direction: 'reduce' as const }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Reverse simulation</h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          This traces a direction through curated relationships whose causal standing is at least
          mechanistically supported. It is a map of what has been written down, not a prediction
          about a person &mdash; and the places it refuses to go are as informative as the places it
          reaches.
        </p>
      </header>

      <SimulateWorkspace choices={choices} />

      {/* §49 inline rather than behind a link: this is the page where a result
          is most likely to be over-read. */}
      <DefinitionsPanel definitions={bundle.rejuvenationDefinitions} />
    </div>
  );
}
