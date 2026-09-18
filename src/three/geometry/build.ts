import type { BufferGeometry } from 'three';
import {
  BoxGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  LatheGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import type { PrimitiveSpec } from '@schemas/index';

/**
 * Every shape in the figure is built here from primitives, because no licensed
 * anatomical model is available in this environment.
 *
 * These are pure functions of their spec, which means they can be unit-tested
 * headlessly (bounding box, vertex count) with no GPU, and memoised on a key
 * derived from the spec so a scene rebuild costs nothing.
 */
const cache = new Map<string, BufferGeometry>();

function keyFor(spec: PrimitiveSpec): string {
  return JSON.stringify(spec);
}

export function buildPrimitive(spec: PrimitiveSpec): BufferGeometry {
  const key = keyFor(spec);
  const hit = cache.get(key);
  if (hit) return hit;

  const geometry = create(spec);
  cache.set(key, geometry);
  return geometry;
}

function create(spec: PrimitiveSpec): BufferGeometry {
  switch (spec.shape) {
    case 'ellipsoid': {
      const g = new SphereGeometry(spec.radius, 24, 16);
      g.scale(spec.scale[0], spec.scale[1], spec.scale[2]);
      return g;
    }

    case 'capsule':
      return new CapsuleGeometry(spec.radius, spec.length, 6, 16);

    case 'lathe': {
      /*
       * The torso is the one shape that decides whether the figure reads as a
       * body or as a stack of cylinders, so it is a lathe over a hand-authored
       * profile rather than a capsule — and the non-uniform Z scale below turns
       * the circular cross-section into an elliptical one, which is most of the
       * remaining difference.
       */
      const points = spec.profile.map(([r, y]) => new Vector2(Math.max(r, 0.001), y));
      const g = new LatheGeometry(points, 28);
      g.scale(1, 1, spec.depth_scale);
      return g;
    }

    case 'tube': {
      const curve = new CatmullRomCurve3(spec.path.map(([x, y, z]) => new Vector3(x, y, z)));
      return new TubeGeometry(curve, Math.max(spec.path.length * 6, 16), spec.radius, 10, false);
    }

    case 'box': {
      // BoxGeometry has no bevel; segmenting it lets the material shade the
      // edges softly enough that organs like the liver do not read as crates.
      const segments = spec.bevel > 0 ? 3 : 1;
      return new BoxGeometry(
        spec.size[0],
        spec.size[1],
        spec.size[2],
        segments,
        segments,
        segments,
      );
    }
  }
}

/** Test seam: geometries are cached for the life of the process otherwise. */
export function clearGeometryCache(): void {
  for (const g of cache.values()) g.dispose();
  cache.clear();
}

export function geometryCacheSize(): number {
  return cache.size;
}

/**
 * Lathe and tube geometries carry absolute coordinates in their profile or
 * path, so they must not also be translated by the part position; everything
 * else is positioned normally. Keeping this in one place stops the three
 * renderers disagreeing about it.
 */
export function usesAbsoluteCoordinates(spec: PrimitiveSpec): boolean {
  return spec.shape === 'lathe' || spec.shape === 'tube';
}
