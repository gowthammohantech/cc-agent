'use client';

import dynamic from 'next/dynamic';
import type { BodyLayout } from '@schemas/index';
import type { HighlightSpec } from '@/three/renderer/BodyRenderer';
import { SvgBodyRenderer } from './SvgBodyRenderer';

/**
 * three.js is code-split, and the SVG diagram is its loading placeholder rather
 * than a spinner — so the body view shows real content immediately and the
 * heavier renderer swaps in when it is ready.
 *
 * ssr:false because WebGL has no server-side equivalent.
 */
const ThreeBodyScene = dynamic(() => import('@/three/scene/ThreeBodyScene'), {
  ssr: false,
  loading: () => null,
});

export function ThreeBodyRenderer(props: {
  layout: BodyLayout;
  selectedSystemId: string | null;
  selectedEntityId: string | null;
  hoveredEntityId: string | null;
  highlights: ReadonlyMap<string, HighlightSpec>;
  reducedMotion: boolean;
  onSelect: (entityId: string) => void;
  onHover: (entityId: string | null) => void;
}) {
  return (
    <>
      <ThreeBodyScene {...props} />
      <noscript>
        <SvgBodyRenderer
          layout={props.layout}
          selectedSystemId={props.selectedSystemId}
          selectedEntityId={props.selectedEntityId}
          highlights={props.highlights}
          onSelect={props.onSelect}
          onHover={props.onHover}
        />
      </noscript>
    </>
  );
}
