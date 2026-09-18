'use client';

import { startTransition, useCallback, useRef } from 'react';
import type { AgeBand } from '@schemas/index';
import { MAX_SLIDER_AGE, MIN_SLIDER_AGE, useAppStore } from '@/state/store';
import { AgeBandRail } from './AgeBandRail';

function bandFor(bands: readonly AgeBand[], age: number): AgeBand | undefined {
  return bands.find((b) => age >= b.age_min && age <= b.age_max);
}

export function AgeSlider({ bands }: { bands: readonly AgeBand[] }) {
  const age = useAppStore((s) => s.age);
  const setAgeDraft = useAppStore((s) => s.setAgeDraft);
  const commitAge = useAppStore((s) => s.commitAge);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.target.value);

      // The thumb position is written straight to a CSS custom property, so it
      // tracks the pointer without waiting for a React render (§43). The
      // committed value follows in a transition, which React may interrupt if a
      // panel below is expensive — the thumb never stutters as a result.
      trackRef.current?.style.setProperty('--age-fraction', String(next / MAX_SLIDER_AGE));
      setAgeDraft(next);
      startTransition(() => commitAge(next));
    },
    [setAgeDraft, commitAge],
  );

  const band = bandFor(bands, age);
  const label = band ? `Age ${age}, ${band.label.toLowerCase()}` : `Age ${age}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor="age-slider" className="text-sm font-medium">
          Age
        </label>
        <output
          htmlFor="age-slider"
          className="font-mono text-2xl font-semibold tabular-nums"
          aria-hidden="true"
        >
          {age}
          {age === MAX_SLIDER_AGE ? '+' : ''}
        </output>
      </div>

      <div ref={trackRef} style={{ ['--age-fraction' as string]: String(age / MAX_SLIDER_AGE) }}>
        {/*
          A native range input, never a div with drag handlers: it brings
          keyboard support, touch targets, form semantics and screen-reader
          announcement that a custom control has to reimplement and usually
          reimplements incompletely.
        */}
        <input
          id="age-slider"
          type="range"
          min={MIN_SLIDER_AGE}
          max={MAX_SLIDER_AGE}
          step={1}
          value={age}
          onChange={handleInput}
          aria-valuetext={label}
          aria-describedby="age-slider-help"
          className="h-11 w-full cursor-pointer accent-[var(--color-accent)]"
        />
      </div>

      <AgeBandRail bands={bands} currentAge={age} />

      <p id="age-slider-help" className="text-xs text-[var(--color-ink-muted)]">
        Arrow keys move one year, Page Up and Page Down move ten, Home and End jump to the ends.
        {band?.data_sparsity_note ? ` ${band.data_sparsity_note}` : ''}
      </p>
    </div>
  );
}
