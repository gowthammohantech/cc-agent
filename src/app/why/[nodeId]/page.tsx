import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBundle } from '@/content/bundle';
import { downstreamOf, nodeFor, upstreamOf } from '@/domain/graph/graph';
import { GraphPanel } from '@/components/graph/GraphPanel';
import { GraphLegend } from '@/components/graph/GraphLegend';

export function generateStaticParams() {
  const bundle = getBundle();
  return [...bundle.hallmarks.map((h) => h.id), ...bundle.entities.map((e) => e.id)].map(
    (nodeId) => ({ nodeId }),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}): Promise<Metadata> {
  const { nodeId } = await params;
  const node = nodeFor(getBundle(), nodeId);
  return { title: node.kind === 'unknown' ? 'Not found' : `Why: ${node.name}` };
}

/** P6 — "Why is this happening?" */
export default async function WhyPage({ params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
  const bundle = getBundle();
  const node = nodeFor(bundle, nodeId);
  if (node.kind === 'unknown') notFound();

  const upstream = upstreamOf(bundle, nodeId, 3);
  const downstream = downstreamOf(bundle, nodeId, 3);

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Why: {node.name}</h1>
        {node.description && (
          <p className="mt-2 text-[var(--color-ink-muted)]">{node.description}</p>
        )}
        <p className="mt-3 rounded border border-[var(--color-line)] p-3 text-sm text-[var(--color-ink-muted)]">
          Each edge below carries its own causal standing. An edge marked &ldquo;correlation
          only&rdquo; records that two things move together, which is not a claim that one produces
          the other &mdash; and the direction of an arrow is not evidence of causation by itself.
        </p>
      </header>

      <GraphPanel
        subgraph={upstream}
        focusId={nodeId}
        direction="in"
        heading={`What contributes to ${node.name.toLowerCase()}`}
      />

      <GraphPanel
        subgraph={downstream}
        focusId={nodeId}
        direction="out"
        heading={`What ${node.name.toLowerCase()} contributes to`}
      />

      <GraphLegend />
    </div>
  );
}
