import type { Metadata } from 'next';
import Link from 'next/link';
import { getBundle } from '@/content/bundle';
import { stalenessOf } from '@/domain/evidence/engine';

export const metadata: Metadata = {
  title: 'Research Library',
  description: 'Every source behind every statement in AgeLens, with its limitations.',
};

export default function LibraryPage() {
  const studies = [...getBundle().studies].sort((a, b) => b.year - a.year);

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Research library</h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Every source behind every statement here, with its study type, species, population, sample
          size where reported, and stated limitations.
        </p>
        <p className="mt-2 rounded border border-dashed border-[var(--color-no-data)] p-2 text-sm text-[var(--color-ink-muted)]">
          Source identifiers in this build were transcribed from well-known references and have not
          been resolved against a citation registry. Treat them as leads to check.
        </p>
      </header>

      <ul className="space-y-3">
        {studies.map((s) => {
          const stale = stalenessOf(s);
          return (
            <li key={s.source_id} className="rounded-lg border border-[var(--color-line)] p-4">
              <h2 className="font-medium">
                <Link
                  href={`/library/${s.source_id}`}
                  className="inline-block py-1 hover:underline"
                >
                  {s.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                {s.authors[0]}
                {s.authors.length > 1 ? ' et al.' : ''} &middot; {s.journal} &middot; {s.year}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                <li className="rounded border border-[var(--color-line)] px-1.5 py-0.5">
                  {s.study_type.replace(/_/g, ' ')}
                </li>
                <li className="rounded border border-[var(--color-line)] px-1.5 py-0.5">
                  species: {s.species.replace(/_/g, ' ')}
                </li>
                <li className="rounded border border-[var(--color-line)] px-1.5 py-0.5">
                  n = {s.sample_size ?? 'not reported'}
                </li>
                {stale.flag !== 'current' && (
                  <li className="rounded border border-[var(--color-line)] px-1.5 py-0.5">
                    &#9888; {stale.flag}
                  </li>
                )}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
