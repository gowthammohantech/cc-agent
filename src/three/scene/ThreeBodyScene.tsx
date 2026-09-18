'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { BodyLayout } from '@schemas/index';
import { instancesOf, partsForSystem, type HighlightSpec } from '../renderer/BodyRenderer';
import { BodyPartMesh } from './BodyPartMesh';
import { BodyShell } from './BodyShell';

export interface ThreeBodySceneProps {
  layout: BodyLayout;
  selectedSystemId: string | null;
  selectedEntityId: string | null;
  hoveredEntityId: string | null;
  highlights: ReadonlyMap<string, HighlightSpec>;
  reducedMotion: boolean;
  onSelect: (entityId: string) => void;
  onHover: (entityId: string | null) => void;
}

export default function ThreeBodyScene({
  layout,
  selectedSystemId,
  selectedEntityId,
  hoveredEntityId,
  highlights,
  reducedMotion,
  onSelect,
  onHover,
}: ThreeBodySceneProps) {
  const parts = useMemo(
    () => partsForSystem(layout, selectedSystemId).flatMap((p) => instancesOf(p)),
    [layout, selectedSystemId],
  );

  const centre = layout.figure_height / 2;

  return (
    <div
      aria-hidden="true"
      className="aspect-[1/2] w-full max-w-[20rem] overflow-hidden rounded border border-[var(--color-line)] bg-[var(--color-surface-sunken)]"
    >
      {/*
        aria-hidden: the canvas cannot be navigated, and BodyTree beside it
        carries the same entities in a form that can be. frameloop="demand"
        means the scene draws only when something changes, so an idle page
        costs no CPU.
      */}
      <Canvas
        aria-hidden="true"
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [0, centre, 2.6], fov: 35 }}
        /*
         * preserveDrawingBuffer keeps the rendered frame readable after
         * compositing. It costs a little memory, and it buys two things worth
         * more: the reader can screenshot or save the body view, and the e2e
         * suite can assert the scene actually drew something rather than
         * trusting that a canvas element exists.
         */
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <hemisphereLight args={['#ffffff', '#404a55', 1.15]} />
        <directionalLight position={[2, 4, 3]} intensity={1.1} />

        <Suspense fallback={null}>
          <group position={[0, -centre, 0]}>
            <BodyShell shell={layout.shell} />
            {parts.map(({ part, side, key }) => (
              <BodyPartMesh
                key={key}
                part={part}
                side={side}
                highlight={highlights.get(part.entity_id)}
                isSelected={selectedEntityId === part.entity_id}
                isHovered={hoveredEntityId === part.entity_id}
                onSelect={onSelect}
                onHover={onHover}
              />
            ))}
          </group>
        </Suspense>

        {/*
          No autoRotate, ever. Under reduced motion the damping is switched off
          too, so a drag moves the camera directly rather than easing into place.
        */}
        <OrbitControls
          enablePan={false}
          enableDamping={!reducedMotion}
          dampingFactor={0.08}
          minDistance={1.2}
          maxDistance={4.5}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
