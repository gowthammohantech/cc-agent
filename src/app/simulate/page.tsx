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

  // Only nodes that actually have outgoing causal links can seed anything, so
  // offering the rest would promise a trace the corpus cannot deliver.
  const choices = bundle.hallmarks
    .filter((h) => (bundle.indexes.outgoing.get(h.id) ?? []).length > 0)
    .map((h) => ({
      id: h.id,
      name: h.name,
      direction:
        h.id === 'cellular_senescence' || h.id === 'chronic_inflammation'
          ? ('reduce' as const)
          : ('improve' as const),
    }))
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
