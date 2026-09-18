'use client';

import type { BiologicalEntity } from '@schemas/index';

export function SystemPicker({
  systems,
  selectedId,
  onSelect,
}: {
  systems: readonly BiologicalEntity[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="system-picker" className="text-[var(--color-ink-muted)]">
        System:
      </label>
      <select
        id="system-picker"
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value === '' ? null : e.target.value)}
        className="rounded border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-2 py-1"
      >
        <option value="">All systems</option>
        {systems.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
