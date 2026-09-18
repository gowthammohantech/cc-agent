import Link from 'next/link';
import type { Observation } from '@schemas/index';
import { CHANGE_CLASS_LABEL } from '@schemas/index';
import type { HallmarkState } from '@/domain/timeline/engine';
import type { EvidenceBadge as Badge } from '@/domain/evidence/engine';
import { EvidenceBadge } from '@/components/evidence/EvidenceBadge';
import { UncertaintyNote } from '@/components/evidence/UncertaintyNote';
import { MissingDataNote } from '@/components/evidence/MissingDataNote';
import { ScientificStatement } from '@/components/safety/ScientificStatement';

const CHANGE_CLASS_STYLE: Record<Observation['change_class'], string> = {
  development: 'border-[var(--color-class-development)]',
  age_associated_change: 'border-[var(--color-class-age-associated)]',
  disease_associated: 'border-[var(--color-class-disease)]',
  unclear: 'border-[var(--color-class-unclear)]',
};

/**
 * §14 — a hallmark status card. Deliberately no "aging percentage": there is no
 * scientifically defined quantity such a number could represent, so showing one
 * would be inventing it.
 */
export function HallmarkCard({
  state,
  badge,
  age,
}: {
  state: HallmarkState;
  badge: Badge | null;
  age: number;
}) {
  const { hallmark, observations } = state;

  return (
    <article
      aria-labelledby={`hallmark-${hallmark.id}`}
      className="flex h-full flex-col gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4"
    >
      <header>
        <h3 id={`hallmark-${hallmark.id}`} className="font-semibold">
          <Link href={`/hallmarks/${hallmark.id}`} className="hover:underline">
            {hallmark.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{hallmark.description}</p>
      </header>

      {badge && <EvidenceBadge badge={badge} />}

      <div className="flex-1 space-y-2">
        <h4 className="text-xs font-semibold tracking-wide text-[var(--color-ink-muted)] uppercase">
          At age {age}
        </h4>

        {observations.length === 0 ? (
          <MissingDataNote
            what={`${hallmark.name.toLowerCase()} at age ${age}`}
            reason="No observation in this corpus covers this hallmark at this age."
          />
        ) : (
          <ul className="space-y-2">
            {observations.map((o) => (
              <li
                key={o.observation_id}
                className={`border-l-2 pl-3 text-sm ${CHANGE_CLASS_STYLE[o.change_class]}`}
              >
                <ScientificStatement provenance={o.provenance}>
                  <span className="mr-1.5 rounded border border-[var(--color-line)] px-1.5 py-0.5 text-xs">
                    {CHANGE_CLASS_LABEL[o.change_class]}
                  </span>
                  {o.observation}
                </ScientificStatement>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="border-t border-[var(--color-line)] pt-3">
        <UncertaintyNote provenance={hallmark.provenance} />
        <p className="mt-2 text-xs">
          <Link href={`/why/${hallmark.id}`} className="underline">
            Why is this happening?
          </Link>
        </p>
      </footer>
    </article>
  );
}
