import { describe, it, expect, beforeEach } from 'vitest';
import { Box3, Vector3 } from 'three';
import {
  buildPrimitive,
  clearGeometryCache,
  geometryCacheSize,
  usesAbsoluteCoordinates,
} from '@/three/geometry/build';
import { getBundle } from '@/content/bundle';
import type { PrimitiveSpec } from '@schemas/index';

/**
 * Geometry builders are pure functions of their spec, so they can be checked
 * without a GPU — which matters, because a degenerate shape would otherwise
 * only show up as something looking wrong in a screenshot.
 */
function sizeOf(spec: PrimitiveSpec): Vector3 {
  const g = buildPrimitive(spec);
  g.computeBoundingBox();
  const box = g.boundingBox ?? new Box3();
  return box.getSize(new Vector3());
}

describe('procedural geometry', () => {
  beforeEach(() => clearGeometryCache());

  it('builds a non-degenerate ellipsoid at the requested proportions', () => {
    const size = sizeOf({ shape: 'ellipsoid', radius: 0.1, scale: [1, 2, 1] });
    expect(size.x).toBeCloseTo(0.2, 2);
    expect(size.y).toBeCloseTo(0.4, 2);
    // The y:x ratio is what makes a head read as a head rather than a ball.
    expect(size.y / size.x).toBeCloseTo(2, 1);
  });

  it('builds a capsule taller than it is wide', () => {
    const size = sizeOf({ shape: 'capsule', radius: 0.05, length: 0.3 });
    expect(size.y).toBeGreaterThan(size.x);
    expect(size.y).toBeCloseTo(0.4, 1); // length plus both caps
  });

  it('revolves a lathe profile and applies the depth scale', () => {
    // Non-uniform depth is what turns a circular cross-section into an
    // elliptical one, and is most of what makes the torso read as a body.
    const size = sizeOf({
      shape: 'lathe',
      profile: [
        [0.05, 0],
        [0.2, 0.5],
        [0.1, 1],
      ],
      depth_scale: 0.6,
    });
    expect(size.x).toBeCloseTo(0.4, 1);
    expect(size.z).toBeLessThan(size.x);
    expect(size.z / size.x).toBeCloseTo(0.6, 1);
  });

  it('builds a tube that follows its path', () => {
    const size = sizeOf({
      shape: 'tube',
      path: [
        [0, 0, 0],
        [0, 0.5, 0],
        [0, 1, 0],
      ],
      radius: 0.02,
    });
    expect(size.y).toBeGreaterThan(0.9);
    expect(size.x).toBeLessThan(0.1);
  });

  it('builds a box at its stated size', () => {
    const size = sizeOf({ shape: 'box', size: [0.2, 0.1, 0.05], bevel: 0.01 });
    expect(size.x).toBeCloseTo(0.2, 3);
    expect(size.y).toBeCloseTo(0.1, 3);
    expect(size.z).toBeCloseTo(0.05, 3);
  });

  it('produces real vertices for every shape', () => {
    const specs: PrimitiveSpec[] = [
      { shape: 'ellipsoid', radius: 0.1, scale: [1, 1, 1] },
      { shape: 'capsule', radius: 0.05, length: 0.2 },
      {
        shape: 'lathe',
        profile: [
          [0.1, 0],
          [0.2, 0.5],
          [0.05, 1],
        ],
        depth_scale: 1,
      },
      {
        shape: 'tube',
        path: [
          [0, 0, 0],
          [0, 1, 0],
        ],
        radius: 0.01,
      },
      { shape: 'box', size: [0.1, 0.1, 0.1], bevel: 0 },
    ];
    for (const spec of specs) {
      const count = buildPrimitive(spec).getAttribute('position').count;
      expect(count, spec.shape).toBeGreaterThan(8);
    }
  });

  it('memoises by spec so rebuilding a scene costs nothing', () => {
    const spec: PrimitiveSpec = { shape: 'ellipsoid', radius: 0.1, scale: [1, 1, 1] };
    const first = buildPrimitive(spec);
    expect(buildPrimitive({ ...spec })).toBe(first);
    expect(geometryCacheSize()).toBe(1);
  });

  it('knows which shapes carry their own absolute coordinates', () => {
    // Translating a lathe or tube again would move it off the figure entirely;
    // keeping the rule in one place stops the renderers disagreeing about it.
    expect(
      usesAbsoluteCoordinates({
        shape: 'lathe',
        profile: [
          [1, 0],
          [1, 1],
          [1, 2],
        ],
        depth_scale: 1,
      }),
    ).toBe(true);
    expect(
      usesAbsoluteCoordinates({
        shape: 'tube',
        path: [
          [0, 0, 0],
          [0, 1, 0],
        ],
        radius: 0.1,
      }),
    ).toBe(true);
    expect(usesAbsoluteCoordinates({ shape: 'capsule', radius: 0.1, length: 0.1 })).toBe(false);
  });

  it('builds every part in the shipped layout without producing a degenerate shape', () => {
    const layout = getBundle().bodyLayout;
    for (const part of [...layout.parts, ...layout.shell]) {
      const g = buildPrimitive(part.primitive);
      g.computeBoundingBox();
      const size = g.boundingBox?.getSize(new Vector3()) ?? new Vector3();
      const volume = size.x * size.y * size.z;
      expect(volume, `${part.geometry_key} is degenerate`).toBeGreaterThan(0);
      expect(Number.isFinite(volume), `${part.geometry_key} has non-finite bounds`).toBe(true);
    }
  });

  it('keeps every part inside the figure envelope', () => {
    // A part placed outside the body would float beside it in 3D and be
    // clipped in the SVG, which is exactly the kind of error a layout file
    // invites and a screenshot hides.
    const layout = getBundle().bodyLayout;
    for (const part of layout.parts) {
      const [x, y] = part.position;
      expect(Math.abs(x), `${part.geometry_key} x`).toBeLessThan(0.6);
      expect(y, `${part.geometry_key} y`).toBeGreaterThanOrEqual(-0.1);
      expect(y, `${part.geometry_key} y`).toBeLessThanOrEqual(layout.figure_height);
    }
  });
});
