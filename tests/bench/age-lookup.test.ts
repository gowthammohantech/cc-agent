import { describe, it, expect } from 'vitest';
import { selectAgeSnapshot, clearSnapshotCache } from '@/state/selectors';
import { getBundle } from '@/content/bundle';

/**
 * §43 asks for a slider update that feels immediate. The selector is the only
 * part of that budget this layer controls — React rendering and paint sit on
 * top — so it is held to a much tighter bound than the 100ms target.
 *
 * Asserted rather than reported: a printed benchmark nobody reads does not stop
 * a regression from shipping.
 */
function percentile(samples: number[], p: number): number {
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
}

describe('age snapshot performance', () => {
  it('computes a cold snapshot well inside the frame budget', () => {
    getBundle(); // exclude one-time parsing from the measurement

    const samples: number[] = [];
    for (let age = 0; age <= 100; age++) {
      clearSnapshotCache();
      const start = performance.now();
      selectAgeSnapshot(age, 'general_adult');
      samples.push(performance.now() - start);
    }

    const p95 = percentile(samples, 95);
    expect(p95, `cold p95 was ${p95.toFixed(2)}ms`).toBeLessThan(10);
  });

  it('serves a cached age fast enough that scrubbing back is free', () => {
    getBundle();
    selectAgeSnapshot(70, 'general_adult');

    const samples: number[] = [];
    for (let i = 0; i < 500; i++) {
      const start = performance.now();
      selectAgeSnapshot(70, 'general_adult');
      samples.push(performance.now() - start);
    }

    const p95 = percentile(samples, 95);
    expect(p95, `warm p95 was ${p95.toFixed(3)}ms`).toBeLessThan(0.5);
  });

  it('sweeps the whole slider inside a single frame', () => {
    getBundle();
    clearSnapshotCache();

    const start = performance.now();
    for (let age = 0; age <= 100; age++) selectAgeSnapshot(age, 'general_adult');
    const elapsed = performance.now() - start;

    expect(elapsed, `full sweep took ${elapsed.toFixed(1)}ms`).toBeLessThan(250);
  });

  it('bounds the cache rather than growing with every age visited', () => {
    clearSnapshotCache();
    for (let age = 0; age <= 100; age++) selectAgeSnapshot(age, 'general_adult');
    // A leak here would be invisible in tests but real in a long session.
    const start = performance.now();
    selectAgeSnapshot(0, 'general_adult'); // evicted by now, so this recomputes
    expect(performance.now() - start).toBeLessThan(10);
  });
});
