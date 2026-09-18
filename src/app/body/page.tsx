import type { Metadata } from 'next';
import { getBundle } from '@/content/bundle';
import { BodyWorkspace } from '@/components/body/BodyWorkspace';
import { buildEntityTree } from '@/components/body/buildTree';

export const metadata: Metadata = {
  title: 'Explore Human Body',
  description:
    'Move from organism to system, organ, tissue, cell, organelle and pathway while holding one selected age.',
};

export default function BodyPage() {
  const bundle = getBundle();

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Explore the human body</h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Select a structure in the diagram or the tree to see what this corpus documents about it
          at the selected age. Both views show the same entities, so nothing is reachable only by
          pointing at a picture.
        </p>
      </header>

      <BodyWorkspace
        layout={bundle.bodyLayout}
        tree={buildEntityTree(bundle)}
        entities={bundle.entities}
        systems={bundle.entities.filter((e) => e.layer === 'L2_system')}
        bands={bundle.ageBands}
      />
    </div>
  );
}
