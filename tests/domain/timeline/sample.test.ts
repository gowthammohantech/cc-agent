import { describe, it, expect } from 'vitest';
import { sampleTrajectory } from '@/domain/timeline/sample';
import type { Trajectory } from '@schemas/index';

/**
 * The production corpus has no trajectories (see content/CHANGELOG.md), so the
 * engine's four sample states are exercised with fixtures. That is the right
 * place for them anyway: these tests assert engine behaviour, not content.
 */
function fixture(over: Partial<Trajectory> = {}): Trajectory {
  return {
    trajectory_id: 'traj_001',
    entity_id: 'skeletal_muscle',
    measure: 'example measure',
    unit: 'units',
    population_id: 'general_adult',
    points: [
      { age: 30, value: 100, citation: { source_id: 'SRC-001', supports: 'direct' } },
      { age: 70, value: 60, citation: { source_id: 'SRC-001', supports: 'direct' } },
    ],
    supported_age_range: [30, 70],
    interpolation: 'none',
    interpolation_rationale: null,
    gaps: [],
    shape_note: 'Two measured points only; the shape between them is unknown.',
    provenance: {
      evidence_level: 'human_observational',
      causal_status: 'correlational_only',
      review_status: 'in_review',
      confidence: 'moderate',
      citations: [{ source_id: 'SRC-001', supports: 'direct' }],
      uncertainty: {
        description: 'Fixture trajectory used only for engine tests.',
        known_conflicts: [],
        generalizability: 'population_average',
      },
      reviewed_by: null,
      reviewed_at: null,
      record_version: 1,
    },
    ...over,
  };
}

describe('sampleTrajectory (FR-01)', () => {
  it('returns a measured value at an exact point', () => {
    const s = sampleTrajectory(fixture(), 30);
    expect(s.status).toBe('supported');
    if (s.status === 'supported') {
      expect(s.value).toBe(100);
      expect(s.citation.source_id).toBe('SRC-001');
    }
  });

  it('NEVER invents a value between points when interpolation is off', () => {
    const s = sampleTrajectory(fixture(), 50);
    expect(s.status).toBe('no_data');
    if (s.status === 'no_data') {
      expect(s.nearest_supported).toEqual([30, 70]);
      expect(s.reason).toMatch(/does not permit interpolation/);
    }
    // The critical property: there is no `value` to accidentally render.
    expect(s).not.toHaveProperty('value');
  });

  it('tags an interpolated value as interpolated and carries its rationale', () => {
    const t = fixture({
      interpolation: 'linear_between_points',
      interpolation_rationale:
        'Measured densely enough in the source that linear reading between points is defensible.',
    });
    const s = sampleTrajectory(t, 50);
    expect(s.status).toBe('interpolated');
    if (s.status === 'interpolated') {
      expect(s.value).toBe(80);
      expect(s.basis).toEqual({ from: 30, to: 70 });
      expect(s.rationale).toMatch(/defensible/);
    }
  });

  it('holds the previous value for step_by_band rather than sloping', () => {
    const t = fixture({
      interpolation: 'step_by_band',
      interpolation_rationale:
        'The source reports one figure per age band, not a continuous curve.',
    });
    const s = sampleTrajectory(t, 50);
    expect(s.status).toBe('interpolated');
    if (s.status === 'interpolated') expect(s.value).toBe(100);
  });

  it('lets a declared gap win even when points bracket it on both sides', () => {
    // An author who wrote "not measured between 40 and 60" said something that
    // interpolation would otherwise erase.
    const t = fixture({
      interpolation: 'linear_between_points',
      interpolation_rationale: 'Linear reading is defensible over the measured span.',
      gaps: [
        { age_min: 40, age_max: 60, reason: 'Not measured in this cohort between 40 and 60.' },
      ],
    });
    const s = sampleTrajectory(t, 50);
    expect(s.status).toBe('no_data');
    if (s.status === 'no_data') expect(s.reason).toMatch(/Not measured in this cohort/);
  });

  it('reports out-of-range rather than extrapolating', () => {
    const s = sampleTrajectory(fixture(), 85);
    expect(s.status).toBe('out_of_range');
    if (s.status === 'out_of_range') expect(s.supported_age_range).toEqual([30, 70]);
  });

  it('refuses to extrapolate past the outermost points even when interpolating', () => {
    const t = fixture({
      supported_age_range: [20, 90],
      interpolation: 'linear_between_points',
      interpolation_rationale: 'Linear reading is defensible over the measured span.',
    });
    expect(sampleTrajectory(t, 25).status).toBe('no_data');
    expect(sampleTrajectory(t, 85).status).toBe('no_data');
  });
});
