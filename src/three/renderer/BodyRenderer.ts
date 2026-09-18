import type { BodyLayout, BodyPart } from '@schemas/index';

/**
 * The body view is one renderer among several, deliberately.
 *
 * Because there are no licensed anatomical assets here, the three.js figure is
 * built from primitives and will always read as a schematic rather than
 * anatomy. Putting it behind an interface means it is never the only way to
 * reach any information: the SVG diagram and the DOM tree are driven from the
 * same layout file and expose the same entities, so nothing is lost when WebGL
 * is unavailable, motion is reduced, or a reader is using a screen reader.
 *
 * It also means a licensed GLTF renderer can be added later as a fourth
 * implementation without touching src/domain or the selection state.
 */
export type RendererId = 'three' | 'svg' | 'dom';

export interface HighlightSpec {
  /** 1-based index matching a numbered entry in the DOM legend (§46). */
  calloutNumber: number;
  label: string;
  /** Pattern carries evidence strength; colour only reinforces it. */
  pattern: 'solid' | 'hatch' | 'cross-hatch' | 'dots' | 'sparse-dots';
  colorToken: string;
  description: string;
}

export interface BodyRendererProps {
  layout: BodyLayout;
  age: number;
  selectedSystemId: string | null;
  selectedEntityId: string | null;
  hoveredEntityId: string | null;
  highlights: ReadonlyMap<string, HighlightSpec>;
  reducedMotion: boolean;
}

export interface RendererEvents {
  onSelect: (entityId: string) => void;
  onHover: (entityId: string | null) => void;
}

export interface BodyRendererCapabilities {
  rotate: boolean;
  zoom: boolean;
  depth: boolean;
}

export const RENDERER_CAPABILITIES: Readonly<Record<RendererId, BodyRendererCapabilities>> = {
  three: { rotate: true, zoom: true, depth: true },
  svg: { rotate: false, zoom: true, depth: false },
  dom: { rotate: false, zoom: false, depth: false },
};

export const RENDERER_LABEL: Readonly<Record<RendererId, string>> = {
  three: '3D',
  svg: 'Diagram',
  dom: 'List',
};

/** Parts belonging to a system, in stable draw order. */
export function partsForSystem(layout: BodyLayout, systemId: string | null): BodyPart[] {
  const parts = systemId ? layout.parts.filter((p) => p.system_id === systemId) : layout.parts;
  return [...parts].sort(
    (a, b) => a.svg_depth - b.svg_depth || a.geometry_key.localeCompare(b.geometry_key),
  );
}

/** Mirrored parts are drawn twice; this expands them into concrete instances. */
export interface PartInstance {
  part: BodyPart;
  /** -1 for the mirrored copy, +1 for the original. */
  side: 1 | -1;
  key: string;
}

export function instancesOf(part: BodyPart): PartInstance[] {
  if (!part.mirror_x) return [{ part, side: 1, key: part.geometry_key }];
  return [
    { part, side: 1, key: `${part.geometry_key}__r` },
    { part, side: -1, key: `${part.geometry_key}__l` },
  ];
}
