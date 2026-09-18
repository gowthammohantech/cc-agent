'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Study } from '@schemas/index';
import { stalenessOf } from '@/domain/evidence/engine';

/**
 * §24's full source record, opened by a `?evidence=SRC-001` search parameter so
 * a drawer is shareable and the back button closes it.
 *
 * Deliberately a client component reading useSearchParams: the pages that host
 * it are prerendered, and doing this on the server would force every one of
 * them dynamic to read a parameter that only affects an overlay.
 */
export function EvidenceDrawer({ studies }: { studies: Readonly<Record<string, Study>> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sourceId = params.get('evidence');
  const study = sourceId ? studies[sourceId] : undefined;

  const close = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete('evidence');
    const query = next.toString();
    // `replace` rather than `push`: opening a drawer already added a history
    // entry, and closing it should return to where the reader was.
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (study && !dialog.open) dialog.showModal();
    if (!study && dialog.open) dialog.close();
  }, [study]);

  if (!study) return <dialog ref={dialogRef} className="hidden" aria-hidden="true" />;

  const stale = stalenessOf(study);
  const rows: Array<[string, string]> = [
    ['Authors', study.authors.join(', ')],
    ['Journal', `${study.journal}, ${study.year}`],
    ['Study type', study.study_type.replace(/_/g, ' ')],
    ['Species', study.species.replace(/_/g, ' ')],
    ['Population', study.population],
    // Never blank: an absent sample size is information, not an empty cell.
    [
      'Sample size',
      study.sample_size === null ? 'Not applicable / not reported' : String(study.sample_size),
    ],
    ['DOI', study.doi ?? 'Not recorded'],
    ['Last reviewed', study.reviewed_at ?? 'Not yet reviewed'],
    ['Last checked', `${study.last_checked_at} — ${stale.description}`],
    [
      'Identifier verification',
      study.reference_verification === 'unverified_offline'
        ? 'Transcribed, not resolved against a citation registry'
        : study.reference_verification.replace(/_/g, ' '),
    ],
  ];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="evidence-drawer-title"
      onClose={close}
      onCancel={close}
      className="m-auto max-h-[85dvh] w-[min(42rem,92vw)] overflow-y-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-5 text-[var(--color-ink)] backdrop:bg-black/40"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="evidence-drawer-title" className="text-lg font-semibold">
          {study.title}
        </h2>
        <button
          type="button"
          onClick={close}
          className="shrink-0 rounded border border-[var(--color-line)] px-2 py-1 text-sm"
        >
          Close
        </button>
      </div>

      <dl className="mt-4 grid gap-x-5 gap-y-2 sm:grid-cols-[11rem_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-sm font-medium">{label}</dt>
            <dd className="text-sm text-[var(--color-ink-muted)]">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="drawer-limitations" className="mt-4">
        <h3 id="drawer-limitations" className="text-sm font-semibold">
          Limitations
        </h3>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-muted)]">
          {study.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </dialog>
  );
}
