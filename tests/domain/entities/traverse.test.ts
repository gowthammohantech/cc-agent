import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import { ancestors, children, descendants, systemOf, zoomPath } from '@/domain/entities/traverse';

const b = getBundle();

describe('entity traversal (FR-02)', () => {
  it('walks the §16 zoom ladder from organism down to a pathway', () => {
    // Human → Heart → Cardiac tissue → Cardiomyocyte → Mitochondria → Pathway.
    const path = zoomPath(b, 'mtor_signaling').map((s) => s.entity.id);
    expect(path[0]).toBe('organism');
    expect(path).toContain('heart');
    expect(path).toContain('cardiac_tissue');
    expect(path).toContain('cardiomyocyte');
    expect(path).toContain('mitochondria');
    expect(path.at(-1)).toBe('mtor_signaling');
  });

  it('labels each rung of the ladder', () => {
    const steps = zoomPath(b, 'cardiomyocyte');
    expect(steps.map((s) => s.layerLabel)).toContain('Cell type');
    expect(steps.map((s) => s.depth)).toEqual(steps.map((_, i) => i));
  });

  it('returns ancestors root-first and children name-sorted', () => {
    expect(ancestors(b, 'heart').map((e) => e.id)).toEqual(['organism', 'cardiovascular_system']);
    const names = children(b, 'organism').map((e) => e.name);
    expect(names).toEqual([...names].sort((a, c) => a.localeCompare(c)));
  });

  it('finds every descendant of the root', () => {
    expect(descendants(b, 'organism')).toHaveLength(b.entities.length - 1);
  });

  it('honours a depth limit', () => {
    expect(descendants(b, 'organism', 1)).toHaveLength(12); // the organ systems
  });

  it('resolves the owning system from any depth', () => {
    expect(systemOf(b, 'mitochondria')?.id).toBe('cardiovascular_system');
    expect(systemOf(b, 'heart')?.id).toBe('cardiovascular_system');
    expect(systemOf(b, 'cardiovascular_system')?.id).toBe('cardiovascular_system');
    expect(systemOf(b, 'organism')).toBeNull();
  });

  it('returns an empty path for an unknown entity instead of throwing', () => {
    expect(zoomPath(b, 'not_an_entity')).toEqual([]);
  });
});
