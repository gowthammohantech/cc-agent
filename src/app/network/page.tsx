import type { Metadata } from 'next';
import { getBundle } from '@/content/bundle';
import { NetworkWorkspace } from '@/components/graph/NetworkWorkspace';

export const metadata: Metadata = {
  title: 'Aging Network',
  description:
    'The whole curated relationship graph, filterable by evidence level and causal standing.',
};

export default function NetworkPage() {
  const bundle = getBundle();

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Aging network</h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Every curated relationship in one place. Filter by how strong the evidence is and by what
          causal standing each link actually has &mdash; the network looks very different once
          correlational links are removed, which is the point.
        </p>
      </header>

      <NetworkWorkspace
        relationships={bundle.relationships}
        nodeNames={Object.fromEntries<string>([
          ...bundle.entities.map((e) => [e.id, e.name] as const),
          ...bundle.hallmarks.map((h) => [h.id, h.name] as const),
          ...bundle.researchApproaches.map((a) => [a.id, a.name] as const),
        ])}
      />
    </div>
  );
}
