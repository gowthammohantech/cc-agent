import type { NodeDirection, SimulationOutput } from '@/domain/simulation/types';

const DIRECTION_LABEL: Record<NodeDirection, { glyph: string; text: string }> = {
  toward_younger_reference: { glyph: '↑', text: 'Modelled direction: toward the reference state' },
  toward_older_state: { glyph: '↓', text: 'Modelled direction: away from the reference state' },
  indeterminate: { glyph: '⊕', text: 'Indeterminate — curated evidence points both ways' },
  unsupported: { glyph: '—', text: 'Not supported by any curated path' },
};

export function SimulationResult({ result, age }: { result: SimulationOutput; age: number }) {
  return (
    <div className="space-y-6">
      <section aria-labelledby="sim-nodes-heading" className="space-y-3">
        <div>
          <h2 id="sim-nodes-heading" className="text-lg font-semibold">
            What the model traces from age {age}
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Direction only. There is no magnitude here, and no estimate of anyone&rsquo;s age.
          </p>
        </div>

        {result.affected_nodes.length === 0 ? (
          <p className="rounded border border-dashed border-[var(--color-no-data)] p-3 text-sm">
            No curated causal path leads anywhere from this selection. That is a statement about how
            much is established, not a failure of the model.
          </p>
        ) : (
          <ul className="space-y-2">
            {result.affected_nodes.map((node) => (
              <li
                key={node.node_id}
                className="rounded border border-[var(--color-line)] p-3 text-sm"
              >
                <p className="font-medium">
                  <span aria-hidden="true" className="mr-1.5 font-mono">
                    {DIRECTION_LABEL[node.direction].glyph}
                  </span>
                  {node.node_name}
                </p>
                <p className="mt-0.5 text-[var(--color-ink-muted)]">
                  {DIRECTION_LABEL[node.direction].text} &middot; {node.path.depth} step
                  {node.path.depth === 1 ? '' : 's'} &middot; path confidence {node.path_confidence}
                </p>
                {node.weakest_link && (
                  <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                    Weakest link in the chain: {node.weakest_link.reason}
                  </p>
                )}
                {node.conflicting_paths.length > 0 && (
                  <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                    {node.conflicting_paths.length} conflicting paths were found and both are kept;
                    the model does not average opposing evidence into a single answer.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Where the model stops is a feature, not an omission. */}
      <section aria-labelledby="sim-blocked-heading" className="space-y-3">
        <h2 id="sim-blocked-heading" className="text-lg font-semibold">
          Where the model stops ({result.unsupported_relationships.length})
        </h2>
        {result.unsupported_relationships.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-muted)]">
            No curated link was rejected on this run.
          </p>
        ) : (
          <ul className="space-y-2">
            {result.unsupported_relationships.map((blocked) => (
              <li
                key={blocked.relationship_id}
                className="rounded border border-[var(--color-line)] p-3 text-sm"
              >
                <p className="font-mono text-xs">
                  {blocked.from_node} &rarr; {blocked.to_node}
                </p>
                <p className="mt-0.5 text-[var(--color-ink-muted)]">{blocked.explanation}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {result.truncations.length > 0 && (
        <section aria-labelledby="sim-trunc-heading" className="space-y-2">
          <h2 id="sim-trunc-heading" className="text-lg font-semibold">
            Where the model stopped reasoning ({result.truncations.length})
          </h2>
          <ul className="space-y-1 text-sm text-[var(--color-ink-muted)]">
            {result.truncations.map((t, i) => (
              <li key={`${t.node_id}-${i}`}>
                <code className="font-mono text-xs">{t.node_id}</code> &mdash; {t.explanation}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="sim-scope-heading" className="space-y-2">
        <h2 id="sim-scope-heading" className="text-lg font-semibold">
          What this does and does not establish
        </h2>
        <dl className="space-y-2 text-sm">
          {result.scope_summary.map((s) => (
            <div key={s.scope} className="rounded border border-[var(--color-line)] p-3">
              <dt className="font-medium">{s.scope.replace(/_/g, ' ')}</dt>
              <dd className="text-[var(--color-ink-muted)]">{s.statement}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="sim-bounds-heading"
        className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-sunken)] p-4 text-sm"
      >
        <h2 id="sim-bounds-heading" className="font-semibold">
          Model bounds
        </h2>
        <p className="mt-1 text-[var(--color-ink-muted)]">{result.bounds_description}</p>
        <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
          Run <code className="font-mono">{result.run_id}</code> &middot; model{' '}
          {result.model_version} &middot; content {result.content_version}
        </p>
      </section>
    </div>
  );
}
