'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CAUSAL_STATUS_LABEL,
  EvidenceLevel,
  EVIDENCE_LEVEL_LABEL,
  EVIDENCE_LEVEL_ORDER,
  RELATIONSHIP_LABEL,
  type Relationship,
} from '@schemas/index';
import { CAUSAL_EDGE_STYLE } from '@/domain/graph/edgeSemantics';
import { GraphLegend } from './GraphLegend';

export function NetworkWorkspace({
  relationships,
  nodeNames,
}: {
  relationships: readonly Relationship[];
  nodeNames: Readonly<Record<string, string>>;
}) {
  const [minEvidence, setMinEvidence] = useState<EvidenceLevel>('speculative');
  const [causalOnly, setCausalOnly] = useState(false);

  const filtered = useMemo(() => {
    const limit = EVIDENCE_LEVEL_ORDER.indexOf(minEvidence);
    return relationships
      .filter((r) => EVIDENCE_LEVEL_ORDER.indexOf(r.provenance.evidence_level) <= limit)
      .filter(
        (r) =>
          !causalOnly ||
          ['established_causal', 'supported_mechanistically'].includes(r.provenance.causal_status),
      )
      .sort((a, b) => a.relationship_id.localeCompare(b.relationship_id));
  }, [relationships, minEvidence, causalOnly]);

  const byStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of filtered) {
      counts.set(r.provenance.causal_status, (counts.get(r.provenance.causal_status) ?? 0) + 1);
    }
    return counts;
  }, [filtered]);

  const name = (id: string) => nodeNames[id] ?? id;

  return (
    <div className="space-y-5">
      <fieldset className="flex flex-wrap items-end gap-5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4 text-sm">
        <legend className="px-1 font-medium">Filters</legend>

        <div className="flex items-center gap-2">
          <label htmlFor="min-evidence">Minimum evidence</label>
          <select
            id="min-evidence"
            value={minEvidence}
            onChange={(e) => setMinEvidence(e.target.value as EvidenceLevel)}
            className="rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1"
          >
            {EvidenceLevel.options.map((level) => (
              <option key={level} value={level}>
                {EVIDENCE_LEVEL_LABEL[level]} or stronger
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={causalOnly}
            onChange={(e) => setCausalOnly(e.target.checked)}
          />
          Causally supported links only
        </label>
      </fieldset>

      <p className="text-sm text-[var(--color-ink-muted)]">
        Showing {filtered.length} of {relationships.length} relationships.{' '}
        {byStatus.get('correlational_only') !== undefined && (
          <>
            {byStatus.get('correlational_only')} of these are correlational only and do not support
            a causal reading.
          </>
        )}
      </p>

      <table className="w-full border-collapse text-sm">
        <caption className="mb-2 text-left text-[var(--color-ink-muted)]">
          Curated relationships, each with its causal standing stated in words.
        </caption>
        <thead>
          <tr className="border-b border-[var(--color-line)] text-left">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Relationship
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Causal standing
            </th>
            <th scope="col" className="py-2 font-semibold">
              Evidence
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.relationship_id} className="border-b border-[var(--color-line)] align-top">
              <td className="py-2 pr-3">
                <Link href={`/why/${r.from_node}`} className="underline">
                  {name(r.from_node)}
                </Link>{' '}
                <em className="text-[var(--color-ink-muted)]">
                  {RELATIONSHIP_LABEL[r.relationship]}
                </em>{' '}
                <Link href={`/why/${r.to_node}`} className="underline">
                  {name(r.to_node)}
                </Link>
              </td>
              <td className="py-2 pr-3">
                {CAUSAL_STATUS_LABEL[r.provenance.causal_status]}
                <span className="block text-xs text-[var(--color-ink-muted)]">
                  {CAUSAL_EDGE_STYLE[r.provenance.causal_status].textPrefix.replace(':', '')}
                </span>
              </td>
              <td className="py-2">{EVIDENCE_LEVEL_LABEL[r.provenance.evidence_level]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <p className="rounded border border-dashed border-[var(--color-no-data)] p-3 text-sm">
          No relationship in this corpus meets that filter. That is a statement about how much is
          established, not a rendering problem.
        </p>
      )}

      <GraphLegend />
    </div>
  );
}
