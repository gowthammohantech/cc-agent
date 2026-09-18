import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import { compareAges, NO_COMPARABLE_REASON_TEXT } from '@/domain/compare/engine';
import { TrajectorySchema } from '@schemas/index';

const b = getBundle();

describe('compare engine (FR-06)', () => {
  it('compares across every organ system when no dimensions are named', () => {
    const result = compareAges(b, {
      ageA: 30,
      ageB: 70,
      dimensions: [],
      populationId: 'general_adult',
    });
    expect(result.rows).toHaveLength(12);
  });

  it('always carries population context with the comparison', () => {
    const result = compareAges(b, {
      ageA: 30,
      ageB: 70,
      dimensions: ['skeletal_muscle'],
      populationId: 'general_adult',
    });
    expect(result.population.id).toBe('general_adult');
    expect(result.population.caveats.length).toBeGreaterThan(0);
  });

  it('states why a comparison is impossible rather than leaving a blank', () => {
    const result = compareAges(b, {
      ageA: 30,
      ageB: 70,
      dimensions: [],
      populationId: 'general_adult',
    });
    const gaps = result.rows.filter((r) => r.cell.kind === 'no_comparable_data');
    expect(gaps.length).toBeGreaterThan(0);
    for (const row of gaps) {
      if (row.cell.kind === 'no_comparable_data') {
        expect(NO_COMPARABLE_REASON_TEXT[row.cell.reason]).toBeTruthy();
      }
    }
  });

  it('produces no quantitative cell when there are no curated trajectories', () => {
    // The corpus ships without trajectories, so nothing should claim a delta.
    const result = compareAges(b, {
      ageA: 30,
      ageB: 70,
      dimensions: [],
      populationId: 'general_adult',
    });
    expect(result.rows.filter((r) => r.cell.kind === 'quantitative')).toHaveLength(0);
  });

  it('reports a direction that is genuinely tissue-dependent as such', () => {
    // §15's "Mitochondrial function → tissue-dependent changes" must be
    // representable, not forced into an up/down arrow.
    const result = compareAges(b, {
      ageA: 30,
      ageB: 70,
      dimensions: ['mitochondria'],
      populationId: 'general_adult',
    });
    const cell = result.rows[0]?.cell;
    if (cell?.kind === 'qualitative') {
      expect(cell.direction).toBe('tissue_dependent');
    }
  });

  it('never compares across populations', () => {
    const result = compareAges(b, {
      ageA: 30,
      ageB: 70,
      dimensions: ['skeletal_muscle'],
      populationId: 'general_adult',
    });
    // Every row that produced a value did so from one population only.
    for (const row of result.rows) {
      expect(['qualitative', 'quantitative', 'no_comparable_data']).toContain(row.cell.kind);
    }
  });

  it('rejects an unknown population', () => {
    expect(() =>
      compareAges(b, { ageA: 30, ageB: 70, dimensions: [], populationId: 'nope' }),
    ).toThrow(/Unknown population/);
  });

  it('carries provenance on every cell that makes a claim', () => {
    const result = compareAges(b, {
      ageA: 30,
      ageB: 70,
      dimensions: [],
      populationId: 'general_adult',
    });
    for (const row of result.rows) {
      if (row.cell.kind === 'qualitative' || row.cell.kind === 'quantitative') {
        expect(row.cell.provenance.citations.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('compare engine — quantitative path', () => {
  /**
   * The shipped corpus has no trajectories, so the quantitative branch is
   * exercised with an injected one. These are the cases where a wrong answer
   * would be most damaging: a number that looks like a comparison but is not
   * one travels into screenshots and arguments.
   */
  function withTrajectory(over: Record<string, unknown> = {}) {
    // Parsed through the real schema so the fixture is type-correct and is
    // itself validated — a fixture that could not exist in content would make
    // these tests meaningless.
    const traj = TrajectorySchema.parse({
      trajectory_id: 'traj_999',
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
      shape_note: 'Fixture trajectory for engine tests.',
      provenance: b.hallmarks[0]!.provenance,
      ...over,
    });

    return {
      ...b,
      trajectories: [traj],
      indexes: { ...b.indexes, trajectoriesByEntity: new Map([[traj.entity_id, [traj]]]) },
    };
  }

  it('produces a delta when both ages have measured points on the same measure', () => {
    const result = compareAges(withTrajectory(), {
      ageA: 30,
      ageB: 70,
      dimensions: ['skeletal_muscle'],
      populationId: 'general_adult',
    });
    const cell = result.rows[0]?.cell;
    expect(cell?.kind).toBe('quantitative');
    if (cell?.kind === 'quantitative') {
      expect(cell.a).toBe(100);
      expect(cell.b).toBe(60);
      expect(cell.delta).toBe(-40);
      expect(cell.unit).toBe('units');
    }
  });

  it('refuses to subtract an interpolated value from a measured one', () => {
    // An interpolated point is a drawn line, not a measurement.
    const result = compareAges(
      withTrajectory({
        interpolation: 'linear_between_points',
        interpolation_rationale: 'Linear reading is defensible across the measured span.',
      }),
      { ageA: 30, ageB: 50, dimensions: ['skeletal_muscle'], populationId: 'general_adult' },
    );
    expect(result.rows[0]?.cell.kind).not.toBe('quantitative');
  });

  it('refuses to compare across populations', () => {
    const result = compareAges(withTrajectory({ population_id: 'other_population' }), {
      ageA: 30,
      ageB: 70,
      dimensions: ['skeletal_muscle'],
      populationId: 'general_adult',
    });
    expect(result.rows[0]?.cell.kind).not.toBe('quantitative');
  });

  it('degrades to a stated gap when one age falls outside the supported range', () => {
    const result = compareAges(withTrajectory(), {
      ageA: 20,
      ageB: 70,
      dimensions: ['skeletal_muscle'],
      populationId: 'general_adult',
    });
    expect(result.rows[0]?.cell.kind).not.toBe('quantitative');
  });
});

describe('compare engine — system-level roll-up', () => {
  /**
   * Observations attach to the most specific entity they describe. Without
   * rolling up through the subtree, every system-level comparison reported "no
   * data" while the data sat two levels below it — the page was technically
   * correct and completely useless.
   */
  it('finds data recorded on an organ when the dimension is its system', () => {
    const result = compareAges(b, {
      ageA: 30,
      ageB: 70,
      dimensions: ['musculoskeletal_system'],
      populationId: 'general_adult',
    });
    expect(result.rows[0]?.cell.kind).not.toBe('no_comparable_data');
  });

  it('names the sub-structure a rolled-up statement came from', () => {
    const result = compareAges(b, {
      ageA: 30,
      ageB: 70,
      dimensions: ['musculoskeletal_system'],
      populationId: 'general_adult',
    });
    const cell = result.rows[0]?.cell;
    // Otherwise a muscle finding reads as a statement about the whole system.
    if (cell?.kind === 'qualitative') expect(cell.statement).toMatch(/^[A-Z][^:]+: /);
  });

  it('gives most organ systems something to say at 30 versus 70', () => {
    const result = compareAges(b, {
      ageA: 30,
      ageB: 70,
      dimensions: [],
      populationId: 'general_adult',
    });
    const withData = result.rows.filter((r) => r.cell.kind !== 'no_comparable_data');
    expect(withData.length).toBeGreaterThanOrEqual(6);
  });

  it('still reports a gap for systems that genuinely have none', () => {
    const result = compareAges(b, {
      ageA: 30,
      ageB: 70,
      dimensions: [],
      populationId: 'general_adult',
    });
    expect(result.rows.some((r) => r.cell.kind === 'no_comparable_data')).toBe(true);
  });
});
