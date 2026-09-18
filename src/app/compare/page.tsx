import type { Metadata } from 'next';
import { getBundle } from '@/content/bundle';
import { CompareWorkspace } from '@/components/compare/CompareWorkspace';

export const metadata: Metadata = {
  title: 'Compare Ages',
  description:
    'Put two ages side by side across biological dimensions, with population context and honest gaps where data do not exist.',
};

export default function ComparePage() {
  const population = getBundle().populations[0];
  if (!population)
    throw new Error('No population defined; comparison requires population context.');

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Compare ages</h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          A comparison is only meaningful within one population and one measure. Where this corpus
          cannot honour that, the cell says so rather than producing a number that would travel
          further than its evidence.
        </p>
      </header>

      <CompareWorkspace population={population} />
    </div>
  );
}
