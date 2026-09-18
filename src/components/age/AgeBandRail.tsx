import type { AgeBand } from '@schemas/index';
import { MAX_SLIDER_AGE } from '@/state/store';

/**
 * §9's phases, drawn beneath the slider.
 *
 * Phases are told apart by hatch pattern, border weight and a written label,
 * never by colour alone (§46). The development phases are visually separated
 * from later life because §6 Principles 7 and 8 require development not to read
 * as the start of decline.
 */
const PHASE_PATTERN: Record<AgeBand['phase'], { background: string; label: string }> = {
  development: {
    background:
      'repeating-linear-gradient(45deg, var(--color-class-development) 0 2px, transparent 2px 6px)',
    label: 'Development',
  },
  maturity: {
    background:
      'repeating-linear-gradient(90deg, var(--color-ink-muted) 0 1px, transparent 1px 7px)',
    label: 'Maturity',
  },
  later_life: {
    background:
      'repeating-linear-gradient(-45deg, var(--color-class-age-associated) 0 2px, transparent 2px 5px)',
    label: 'Later life',
  },
};

export function AgeBandRail({
  bands,
  currentAge,
}: {
  bands: readonly AgeBand[];
  currentAge: number;
}) {
  const visible = bands.filter((b) => b.age_min <= MAX_SLIDER_AGE);

  return (
    <div>
      <div
        className="flex h-6 w-full overflow-hidden rounded border border-[var(--color-line)]"
        role="img"
        aria-label={`Life phases across the slider: ${visible
          .map((b) => `${b.label}, ages ${b.age_min} to ${Math.min(b.age_max, MAX_SLIDER_AGE)}`)
          .join('; ')}.`}
      >
        {visible.map((band) => {
          const width =
            ((Math.min(band.age_max, MAX_SLIDER_AGE) - band.age_min) / MAX_SLIDER_AGE) * 100;
          const isCurrent = currentAge >= band.age_min && currentAge <= band.age_max;

          return (
            <div
              key={band.id}
              className={`relative border-r border-[var(--color-line)] last:border-r-0 ${
                isCurrent ? 'ring-2 ring-[var(--color-accent)] ring-inset' : ''
              }`}
              style={{ width: `${width}%`, background: PHASE_PATTERN[band.phase].background }}
              title={`${band.label} (${band.age_min}–${band.age_max})`}
            />
          );
        })}
      </div>

      <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-ink-muted)]">
        {(['development', 'maturity', 'later_life'] as const).map((phase) => (
          <li key={phase} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-5 rounded-sm border border-[var(--color-line)]"
              style={{ background: PHASE_PATTERN[phase].background }}
            />
            {PHASE_PATTERN[phase].label}
          </li>
        ))}
      </ul>
    </div>
  );
}
