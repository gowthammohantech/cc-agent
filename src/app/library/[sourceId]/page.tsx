import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBundle } from '@/content/bundle';
import { stalenessOf } from '@/domain/evidence/engine';

export function generateStaticParams() {
  return getBundle().studies.map((s) => ({ sourceId: s.source_id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}): Promise<Metadata> {
  const { sourceId } = await params;
  const study = getBundle().indexes.studyById.get(sourceId);
  return { title: study ? study.title.slice(0, 60) : 'Source not found' };
}

/** §24 — every field the spec requires, with explicit text where a value is absent. */
export default async function StudyPage({ params }: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await params;
  const study = getBundle().indexes.studyById.get(sourceId);
  if (!study) notFound();

  const stale = stalenessOf(study);
  const rows: Array<[string, React.ReactNode]> = [
    ['Authors', study.authors.join(', ')],
    ['Journal', study.journal],
    ['Year', study.year],
    ['Study type', study.study_type.replace(/_/g, ' ')],
    ['Species', study.species.replace(/_/g, ' ')],
    ['Population', study.population],
    ['Sample size', study.sample_size ?? 'Not applicable / not reported'],
    ['DOI', study.doi ? <code className="font-mono text-sm">{study.doi}</code> : 'Not recorded'],
    ['Last checked', `${study.last_checked_at} (${stale.description})`],
    [
      'Identifier verification',
      study.reference_verification === 'unverified_offline'
        ? 'Transcribed, not resolved against a citation registry'
        : `${study.reference_verification.replace(/_/g, ' ')} on ${study.verified_at ?? 'unknown date'}`,
    ],
    ['Reviewed by', study.reviewed_by ?? 'Not yet reviewed'],
  ];

  return (
    <article className="max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-[var(--color-ink-muted)]">
          <Link href="/library" className="underline">
            Research library
          </Link>
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{study.title}</h1>
      </header>

      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-medium">{label}</dt>
            <dd className="text-[var(--color-ink-muted)]">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="lim-heading">
        <h2 id="lim-heading" className="font-semibold">
          Limitations
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {study.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
