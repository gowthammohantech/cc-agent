import type { Metadata } from 'next';
import Link from 'next/link';
import { getBundle } from '@/content/bundle';
import { badgeFor } from '@/domain/evidence/engine';
import { EvidenceBadge } from '@/components/evidence/EvidenceBadge';
import { UncertaintyNote } from '@/components/evidence/UncertaintyNote';

export const metadata: Metadata = {
  title: 'Hallmarks of Aging',
  description:
    'Twelve commonly discussed hallmarks of aging, each with its evidence, uncertainty and sources.',
};

export default function HallmarksPage() {
  const bundle = getBundle();
  const hallmarks = [...bundle.hallmarks].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Hallmarks of aging</h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          The 2023 framework describes twelve hallmarks. They are not equally well evidenced, and
          the causal ordering between them is largely unresolved &mdash; so each card carries its
          own evidence basis rather than sitting in an undifferentiated list.
        </p>
      </header>

      <ul className="grid gap-4 md:grid-cols-2">
        {hallmarks.map((h) => {
          const profile = bundle.indexes.profileById.get(h.evidence_profile_id);
          return (
            <li
              key={h.id}
              className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4"
            >
              <h2 className="font-semibold">
                <Link href={`/hallmarks/${h.id}`} className="inline-block py-1 hover:underline">
                  {h.name}
                </Link>
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)]">{h.description}</p>
              {profile && <EvidenceBadge badge={badgeFor(profile)} />}
              <UncertaintyNote provenance={h.provenance} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
