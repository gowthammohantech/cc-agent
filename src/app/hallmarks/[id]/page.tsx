import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBundle } from '@/content/bundle';
import { badgeFor } from '@/domain/evidence/engine';
import { neighbors } from '@/domain/graph/graph';
import { RELATIONSHIP_LABEL, CHANGE_CLASS_LABEL } from '@schemas/index';
import { EvidenceBadge } from '@/components/evidence/EvidenceBadge';
import { UncertaintyNote } from '@/components/evidence/UncertaintyNote';
import { MissingDataNote } from '@/components/evidence/MissingDataNote';
import { ScientificStatement } from '@/components/safety/ScientificStatement';
import { CitationList } from '@/components/evidence/CitationList';

export function generateStaticParams() {
  return getBundle().hallmarks.map((h) => ({ id: h.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const hallmark = getBundle().indexes.hallmarkById.get(id);
  return hallmark
    ? { title: hallmark.name, description: hallmark.description.slice(0, 160) }
    : { title: 'Hallmark not found' };
}

export default async function HallmarkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = getBundle();
  const hallmark = bundle.indexes.hallmarkById.get(id);
  if (!hallmark) notFound();

  const profile = bundle.indexes.profileById.get(hallmark.evidence_profile_id);
  const observations = (bundle.indexes.observationsByHallmark.get(id) ?? [])
    .map((oid) => bundle.indexes.observationById.get(oid))
    .filter((o) => o !== undefined);
  const edges = neighbors(bundle, id, 'both');

  return (
    <article className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm text-[var(--color-ink-muted)]">
          <Link href="/hallmarks" className="underline">
            Hallmarks
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{hallmark.name}</h1>
        <p className="text-[var(--color-ink-muted)]">{hallmark.description}</p>
        {profile && <EvidenceBadge badge={badgeFor(profile)} />}
      </header>

      <section aria-labelledby="obs-heading" className="space-y-3">
        <h2 id="obs-heading" className="text-lg font-semibold">
          What is documented
        </h2>
        {observations.length === 0 ? (
          <MissingDataNote what={`observations of ${hallmark.name.toLowerCase()}`} />
        ) : (
          <ul className="space-y-3">
            {observations.map((o) => (
              <li
                key={o.observation_id}
                className="rounded border border-[var(--color-line)] p-3 text-sm"
              >
                <ScientificStatement provenance={o.provenance}>
                  <span className="mr-1.5 rounded border border-[var(--color-line)] px-1.5 py-0.5 text-xs">
                    {CHANGE_CLASS_LABEL[o.change_class]}
                  </span>
                  <span className="mr-1.5 text-xs text-[var(--color-ink-muted)]">
                    ages {o.age_min}&ndash;{o.age_max}
                  </span>
                  {o.observation}
                </ScientificStatement>
                <div className="mt-2">
                  <UncertaintyNote provenance={o.provenance} />
                  <CitationList citations={o.provenance.citations} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="rel-heading" className="space-y-3">
        <h2 id="rel-heading" className="text-lg font-semibold">
          Relationships
        </h2>
        {edges.length === 0 ? (
          <MissingDataNote what={`relationships involving ${hallmark.name.toLowerCase()}`} />
        ) : (
          <ul className="space-y-2 text-sm">
            {edges.map((e) => (
              <li key={e.relationship_id} className="rounded border border-[var(--color-line)] p-3">
                <ScientificStatement provenance={e.provenance}>
                  <code className="font-mono text-xs">{e.from_node}</code>{' '}
                  {RELATIONSHIP_LABEL[e.relationship]}{' '}
                  <code className="font-mono text-xs">{e.to_node}</code>
                </ScientificStatement>
                {e.mechanism_note && (
                  <p className="mt-1 text-[var(--color-ink-muted)]">{e.mechanism_note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm">
          <Link href={`/why/${hallmark.id}`} className="underline">
            See the causal view for {hallmark.name.toLowerCase()}
          </Link>
        </p>
      </section>

      <section aria-labelledby="unc-heading" className="space-y-3">
        <h2 id="unc-heading" className="text-lg font-semibold">
          Uncertainty and sources
        </h2>
        <UncertaintyNote provenance={hallmark.provenance} />
        <CitationList citations={hallmark.provenance.citations} />
      </section>
    </article>
  );
}
