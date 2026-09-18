'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/state/store';
import { getBundle } from '@/content/bundle';
import { runSimulation } from '@/domain/simulation/engine';
import { serializeSimulation } from '@/domain/simulation/serialize';
import type { ModificationDirection } from '@schemas/index';
import { SimulationResult } from './SimulationResult';

interface Choice {
  id: string;
  name: string;
  direction: ModificationDirection;
}

export function SimulateWorkspace({ choices }: { choices: readonly Choice[] }) {
  const age = useAppStore((s) => s.age);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const result = useMemo(() => {
    if (selected.size === 0) return null;
    const modifications = choices
      .filter((c) => selected.has(c.id))
      .map((c) => ({ target: c.id, direction: c.direction }));

    // The engine is pure and the corpus is bundled, so this runs locally; the
    // POST route exists for API consumers and calls exactly the same code.
    return serializeSimulation(
      runSimulation(getBundle(), {
        chronological_age: age,
        reference_age: 30,
        population_id: 'general_adult',
        modifications,
        model_version: 'v1',
      }),
    );
  }, [selected, choices, age]);

  return (
    <div className="space-y-6">
      <fieldset className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4">
        <legend className="px-1 font-medium">Hypothetical changes</legend>
        <p className="mb-3 text-sm text-[var(--color-ink-muted)]">
          Each hallmark names a dysfunction, so a hypothetical improvement means reducing it. Select
          one or more to trace through the curated relationship graph. This traces direction only
          &mdash; it models no magnitude, no timing and no individual.
        </p>

        <ul className="grid gap-2 sm:grid-cols-2">
          {choices.map((choice) => (
            <li key={choice.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded border border-[var(--color-line)] p-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(choice.id)}
                  onChange={(e) =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(choice.id);
                      else next.delete(choice.id);
                      return next;
                    })
                  }
                  className="mt-0.5"
                />
                <span>Reduce {choice.name.toLowerCase()}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {result === null ? (
        <p className="rounded border border-dashed border-[var(--color-no-data)] p-4 text-sm text-[var(--color-ink-muted)]">
          Select at least one change to run the model.
        </p>
      ) : (
        <SimulationResult result={result} age={age} />
      )}
    </div>
  );
}
