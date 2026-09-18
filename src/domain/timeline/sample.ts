import type { CitationRef, Trajectory, InterpolationMode } from '@schemas/index';

/**
 * FR-01 made unignorable at the type level.
 *
 * A caller cannot read `.value` without first narrowing on `status`, so there
 * is no path where an absence of data quietly becomes a number. That is the
 * whole design: the chart draws a labelled gap because the type refused to
 * hand it a value to draw a flat line with.
 */
export type TrajectorySample =
  | {
      status: 'supported';
      age: number;
      value: number;
      interval?: readonly [number, number];
      citation: CitationRef;
    }
  | {
      status: 'interpolated';
      age: number;
      value: number;
      basis: { from: number; to: number };
      method: Exclude<InterpolationMode, 'none'>;
      rationale: string;
    }
  | {
      status: 'no_data';
      age: number;
      reason: string;
      nearest_supported: readonly [number, number] | null;
    }
  | {
      status: 'out_of_range';
      age: number;
      supported_age_range: readonly [number, number];
    };

function nearestSupported(t: Trajectory, age: number): readonly [number, number] | null {
  const ages = t.points.map((p) => p.age).sort((a, b) => a - b);
  const below = [...ages].reverse().find((a) => a <= age);
  const above = ages.find((a) => a >= age);
  if (below === undefined && above === undefined) return null;
  return [below ?? (above as number), above ?? (below as number)] as const;
}

function inDeclaredGap(t: Trajectory, age: number): string | null {
  const gap = t.gaps.find((g) => age >= g.age_min && age <= g.age_max);
  return gap ? gap.reason : null;
}

/**
 * Sample a trajectory at one age.
 *
 * Order matters here. Out-of-range is checked first, then declared gaps —
 * a gap wins even when it is bracketed by real points on both sides, because
 * an author who declared "not measured between 40 and 60" has said something
 * that interpolation would otherwise erase.
 */
export function sampleTrajectory(t: Trajectory, age: number): TrajectorySample {
  const [lo, hi] = t.supported_age_range;
  if (age < lo || age > hi) {
    return { status: 'out_of_range', age, supported_age_range: t.supported_age_range };
  }

  const gapReason = inDeclaredGap(t, age);
  if (gapReason !== null) {
    return {
      status: 'no_data',
      age,
      reason: gapReason,
      nearest_supported: nearestSupported(t, age),
    };
  }

  const exact = t.points.find((p) => p.age === age);
  if (exact) {
    return {
      status: 'supported',
      age,
      value: exact.value,
      ...(exact.interval ? { interval: exact.interval } : {}),
      citation: exact.citation,
    };
  }

  if (t.interpolation === 'none') {
    return {
      status: 'no_data',
      age,
      reason: 'No measurement at this age, and this trajectory does not permit interpolation.',
      nearest_supported: nearestSupported(t, age),
    };
  }

  const sorted = [...t.points].sort((a, b) => a.age - b.age);
  const before = [...sorted].reverse().find((p) => p.age < age);
  const after = sorted.find((p) => p.age > age);

  if (!before || !after) {
    return {
      status: 'no_data',
      age,
      reason: 'This age falls outside the measured points, and extrapolation is not permitted.',
      nearest_supported: nearestSupported(t, age),
    };
  }

  const rationale = t.interpolation_rationale ?? '';
  if (t.interpolation === 'step_by_band') {
    return {
      status: 'interpolated',
      age,
      value: before.value,
      basis: { from: before.age, to: after.age },
      method: 'step_by_band',
      rationale,
    };
  }

  const span = after.age - before.age;
  const weight = span === 0 ? 0 : (age - before.age) / span;
  return {
    status: 'interpolated',
    age,
    value: before.value + (after.value - before.value) * weight,
    basis: { from: before.age, to: after.age },
    method: 'linear_between_points',
    rationale,
  };
}
