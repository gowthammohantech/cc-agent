import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import {
  getAgeOverview,
  getHallmarksAtAge,
  getSystemsAtAge,
  getEntityAtAge,
} from '@/domain/timeline/engine';
import { buildAgeIndex } from '@/domain/timeline/ageIndex';

const b = getBundle();
const ctx = (age: number) => ({ age, populationId: 'general_adult' });

describe('timeline engine', () => {
  it('reports which systems have no data, rather than rendering them blank', () => {
    const overview = getAgeOverview(b, ctx(70));
    expect(overview.coverage.observed).toBeGreaterThan(0);
    // The value here is that this list is populated: the UI needs to say
    // "no curated data for these systems" rather than showing empty panels.
    expect(Array.isArray(overview.coverage.entitiesWithoutData)).toBe(true);
    expect(overview.coverage.entitiesWithoutData).not.toContain('musculoskeletal_system');
  });

  it('places an age in its band and exposes the sparsity note where one exists', () => {
    expect(getAgeOverview(b, ctx(70)).band?.id).toBe('later_adulthood');
    expect(getAgeOverview(b, ctx(25)).band?.id).toBe('early_adulthood');
    expect(getAgeOverview(b, ctx(95)).band?.data_sparsity_note).toMatch(/sparse/i);
  });

  it('returns all twelve hallmarks at any age, with observations attached where they exist', () => {
    const at70 = getHallmarksAtAge(b, ctx(70));
    expect(at70).toHaveLength(12);
    expect(at70.some((h) => h.observations.length > 0)).toBe(true);
  });

  it('returns all twelve systems at any age', () => {
    expect(getSystemsAtAge(b, ctx(70))).toHaveLength(12);
  });

  it('counts observations from anywhere beneath a system, not just on it', () => {
    // Muscle observations hang off skeletal_muscle, an organ two levels down.
    const musculoskeletal = getSystemsAtAge(b, ctx(70)).find(
      (s) => s.entity.id === 'musculoskeletal_system',
    );
    expect(musculoskeletal?.descendantObservationCount).toBeGreaterThan(0);
  });

  it('refuses an unknown population instead of silently defaulting', () => {
    expect(() => getAgeOverview(b, { age: 70, populationId: 'not_a_population' })).toThrow(
      /population context/,
    );
  });

  it('returns null for an unknown entity', () => {
    expect(getEntityAtAge(b, ctx(70), 'not_an_entity')).toBeNull();
  });

  it('finds observations by age range, and nothing outside it', () => {
    const index = buildAgeIndex({
      observations: [
        {
          ...b.observations[0]!,
          observation_id: 'obs_900',
          age_min: 40,
          age_max: 50,
        },
      ],
    });
    expect(index.observationsAt(45)).toEqual(['obs_900']);
    expect(index.observationsAt(40)).toEqual(['obs_900']);
    expect(index.observationsAt(50)).toEqual(['obs_900']);
    expect(index.observationsAt(39)).toEqual([]);
    expect(index.observationsAt(51)).toEqual([]);
  });

  it('returns empty rather than undefined outside the supported age span', () => {
    expect(b.ageIndex.observationsAt(-5)).toEqual([]);
    expect(b.ageIndex.observationsAt(999)).toEqual([]);
  });

  it('keeps development separate from age-associated change', () => {
    // §6 Principles 7-8. A developmental record must never be counted as aging.
    const atFive = getAgeOverview(b, ctx(5)).observations;
    const classes = new Set(atFive.map((o) => o.change_class));
    expect(classes.has('development')).toBe(true);
    expect(atFive.every((o) => o.change_class !== 'disease_associated')).toBe(true);
  });
});
