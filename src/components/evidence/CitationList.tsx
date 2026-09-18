import Link from 'next/link';
import type { CitationRef } from '@schemas/index';
import { getBundle } from '@/content/bundle';

export function CitationList({ citations }: { citations: readonly CitationRef[] }) {
  const bundle = getBundle();

  return (
    <div className="mt-2 text-xs">
      <h4 className="font-semibold text-[var(--color-ink-muted)]">Sources</h4>
      <ul className="mt-1 space-y-1">
        {citations.map((c) => {
          const study = bundle.indexes.studyById.get(c.source_id);
          return (
            <li key={`${c.source_id}-${c.locator ?? ''}`}>
              {/*
                A search-param link rather than a navigation: the reader stays
                where they were, and the URL stays shareable.
              */}
              <Link href={`?evidence=${c.source_id}`} scroll={false} className="underline">
                {study
                  ? `${study.authors[0] ?? 'Unknown'}${study.authors.length > 1 ? ' et al.' : ''} (${study.year}), ${study.journal}`
                  : c.source_id}
              </Link>
              {c.supports !== 'direct' && (
                <span className="ml-1 text-[var(--color-ink-muted)]">[{c.supports}]</span>
              )}
              {study?.reference_verification === 'unverified_offline' && (
                <span className="ml-1 text-[var(--color-ink-muted)]">
                  &mdash; identifier not registry-verified
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
