import Link from 'next/link';
import type { BiologicalEntity, Observation } from '@schemas/index';
import { CHANGE_CLASS_LABEL, ENTITY_LAYER_LABEL } from '@schemas/index';
import { ScientificStatement } from '@/components/safety/ScientificStatement';
import { UncertaintyNote } from '@/components/evidence/UncertaintyNote';
import { MissingDataNote } from '@/components/evidence/MissingDataNote';

export function EntityDetail({
  entity,
  age,
  observations,
}: {
  entity: BiologicalEntity;
  age: number;
  observations: readonly Observation[];
}) {
  return (
    <section
      aria-labelledby="entity-detail-heading"
      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4"
    >
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="entity-detail-heading" className="text-lg font-semibold">
          {entity.name}
        </h2>
        <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5 text-xs">
          {ENTITY_LAYER_LABEL[entity.layer]}
        </span>
        <Link href={`/body/${entity.id}`} className="text-sm underline">
          Zoom into {entity.name.toLowerCase()}
        </Link>
      </header>

      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{entity.description}</p>

      <h3 className="mt-4 text-xs font-semibold tracking-wide text-[var(--color-ink-muted)] uppercase">
        At age {age}
      </h3>
      <div className="mt-2">
        {observations.length === 0 ? (
          <MissingDataNote what={`${entity.name.toLowerCase()} at age ${age}`} />
        ) : (
          <ul className="space-y-3">
            {observations.map((o) => (
              <li key={o.observation_id} className="text-sm">
                <ScientificStatement provenance={o.provenance}>
                  <span className="mr-1.5 rounded border border-[var(--color-line)] px-1.5 py-0.5 text-xs">
                    {CHANGE_CLASS_LABEL[o.change_class]}
                  </span>
                  {o.observation}
                </ScientificStatement>
                <div className="mt-1.5">
                  <UncertaintyNote provenance={o.provenance} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
