import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBundle } from '@/content/bundle';
import { getTargetDetail } from '@/domain/rejuvenation/engine';
import { REJUVENATION_SCOPE_LABEL } from '@schemas/index';
import { EvidenceBadgeStatic } from '@/components/evidence/EvidenceBadgeStatic';
import { UncertaintyNote } from '@/components/evidence/UncertaintyNote';
import { CitationList } from '@/components/evidence/CitationList';

export function generateStaticParams() {
  return getBundle().rejuvenationTargets.map((t) => ({ id: t.target_id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const target = getBundle().indexes.targetById.get(id);
  return { title: target ? target.name : 'Target not found' };
}

const SPECIES_LABEL = {
  human_evidence: 'In humans',
  animal_evidence: 'In animals',
  in_vitro_evidence: 'In cells',
} as const;

export default async function TargetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = getBundle();
  const detail = getTargetDetail(bundle, id);
  if (!detail) notFound();

  const { target } = detail;

  return (
    <article className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm text-[var(--color-ink-muted)]">
          <Link href="/rejuvenation" className="underline">
            Rejuvenation
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{target.name}</h1>
        <p className="text-[var(--color-ink-muted)]">{target.desired_direction}</p>
        <p className="flex flex-wrap gap-2 text-xs">
          <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5">
            {REJUVENATION_SCOPE_LABEL[target.rejuvenation_scope]}
          </span>
          <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5">
            {target.clinical_status.replace(/_/g, ' ')}
          </span>
        </p>
        <EvidenceBadgeStatic provenance={target.provenance} />
      </header>

      {/* §18's seven-step chain, in order. */}
      <section aria-labelledby="chain-heading" className="space-y-3">
        <h2 id="chain-heading" className="text-lg font-semibold">
          From observation to open question
        </h2>
        <ol className="space-y-3">
          {detail.chain.map((step, i) => (
            <li key={step.step} className="rounded border border-[var(--color-line)] p-3">
              <h3 className="text-sm font-semibold">
                <span className="mr-1.5 text-[var(--color-ink-muted)]">{i + 1}.</span>
                {step.label}
              </h3>
              <ul className="mt-1.5 space-y-1 text-sm text-[var(--color-ink-muted)]">
                {step.content.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="species-heading" className="space-y-3">
        <h2 id="species-heading" className="text-lg font-semibold">
          Evidence by species
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {target.reversibility_demonstrated.note}
        </p>
        {(['human_evidence', 'animal_evidence', 'in_vitro_evidence'] as const).map((key) => (
          <div key={key}>
            <h3 className="text-sm font-semibold">{SPECIES_LABEL[key]}</h3>
            {target[key].length === 0 ? (
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                None in this corpus. An empty section here is a real finding, not an oversight.
              </p>
            ) : (
              <ul className="mt-1 space-y-2 text-sm">
                {target[key].map((item) => (
                  <li key={item.summary} className="rounded border border-[var(--color-line)] p-3">
                    {item.summary}
                    <CitationList citations={item.citations} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      <section aria-labelledby="risks-heading" className="space-y-3">
        <h2 id="risks-heading" className="text-lg font-semibold">
          Risks
        </h2>
        <ul className="space-y-2 text-sm">
          {target.risks.map((r) => (
            <li key={r.risk} className="rounded border border-[var(--color-line)] p-3">
              <span className="mr-1.5 rounded border border-[var(--color-line)] px-1.5 py-0.5 text-xs">
                {r.severity.replace(/_/g, ' ')}
              </span>
              {r.risk}
              <CitationList citations={r.citations} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="unknowns-heading" className="space-y-3">
        <h2 id="unknowns-heading" className="text-lg font-semibold">
          Unknowns
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {target.unknowns.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="unc-heading" className="space-y-2">
        <h2 id="unc-heading" className="text-lg font-semibold">
          Uncertainty and sources
        </h2>
        <UncertaintyNote provenance={target.provenance} />
        <CitationList citations={target.provenance.citations} />
      </section>

      <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-sunken)] p-4 text-sm">
        <strong>{bundle.disclaimers.systemic_caveat}</strong>
      </p>
    </article>
  );
}
