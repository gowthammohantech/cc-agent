import type { BodyPart, PrimitiveSpec } from '@schemas/index';

/**
 * Projects the shared 3D layout onto the XY plane for the SVG renderer.
 *
 * Both renderers read the same body-layout.json, so an organ cannot appear in
 * one view and be missing from the other, and a position fixed in one is fixed
 * in both. The projection is orthographic and ignores Z except for draw order.
 */
export interface Projected {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Polyline in view coordinates, for tube-shaped parts. */
  path: string | null;
  rotationDeg: number;
}

export interface ViewBox {
  width: number;
  height: number;
  scale: number;
}

export function viewBoxFor(figureHeight: number, width = 320): ViewBox {
  const height = width * 2;
  return { width, height, scale: height / (figureHeight * 1.05) };
}

function toView(x: number, y: number, view: ViewBox): { x: number; y: number } {
  // Model space is +Y up with the origin at the feet; SVG is +Y down.
  return { x: view.width / 2 + x * view.scale, y: view.height - y * view.scale };
}

function radiiOf(primitive: PrimitiveSpec, scale: number): { rx: number; ry: number } {
  switch (primitive.shape) {
    case 'ellipsoid':
      return {
        rx: primitive.radius * primitive.scale[0] * scale,
        ry: primitive.radius * primitive.scale[1] * scale,
      };
    case 'capsule':
      return {
        rx: primitive.radius * scale,
        ry: (primitive.length / 2 + primitive.radius) * scale,
      };
    case 'box':
      return { rx: (primitive.size[0] / 2) * scale, ry: (primitive.size[1] / 2) * scale };
    case 'lathe': {
      const maxR = Math.max(...primitive.profile.map(([r]) => r));
      const ys = primitive.profile.map(([, y]) => y);
      return { rx: maxR * scale, ry: ((Math.max(...ys) - Math.min(...ys)) / 2) * scale };
    }
    case 'tube':
      return { rx: primitive.radius * scale, ry: primitive.radius * scale };
  }
}

export function projectPart(part: BodyPart, side: 1 | -1, view: ViewBox): Projected {
  const primitive = part.primitive;
  const { rx, ry } = radiiOf(primitive, view.scale);

  // Lathe and tube geometries carry their own absolute Y coordinates in the
  // profile/path; everything else is positioned by `position`.
  let modelX = part.position[0] * side;
  let modelY = part.position[1];
  let path: string | null = null;

  if (primitive.shape === 'lathe') {
    const ys = primitive.profile.map(([, y]) => y);
    modelY = (Math.max(...ys) + Math.min(...ys)) / 2 + part.position[1];
  }

  if (primitive.shape === 'tube') {
    const points = primitive.path.map(([x, y]) =>
      toView(x * side + part.position[0], y + part.position[1], view),
    );
    path = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
    const first = points[0];
    modelX = 0;
    modelY = 0;
    return {
      cx: first?.x ?? 0,
      cy: first?.y ?? 0,
      rx,
      ry,
      path,
      rotationDeg: 0,
    };
  }

  const centre = toView(modelX, modelY, view);
  return {
    cx: centre.x,
    cy: centre.y,
    rx,
    ry,
    path,
    // Rotation about Z maps directly to an SVG rotation; the sign flips on the
    // mirrored side so paired limbs splay outward rather than both leaning one way.
    rotationDeg: ((-part.rotation[2] * 180) / Math.PI) * side,
  };
}
