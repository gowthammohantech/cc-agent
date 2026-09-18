'use client';

import { useMemo, useRef } from 'react';
import type { Mesh } from 'three';
import { DoubleSide } from 'three';
import type { BodyPart } from '@schemas/index';
import type { ThreeEvent } from '@react-three/fiber';
import { buildPrimitive, usesAbsoluteCoordinates } from '../geometry/build';
import { patternTexture } from '../geometry/patterns';
import type { HighlightSpec } from '../renderer/BodyRenderer';

/**
 * Structures that enclose others are drawn translucently, otherwise they hide
 * exactly what the reader opened the body view to look at.
 */
const ENCLOSING_PARTS = new Set(['skin_layer', 'ribcage', 'thigh_muscle', 'arm_muscle']);

export function BodyPartMesh({
  part,
  side,
  highlight,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: {
  part: BodyPart;
  side: 1 | -1;
  highlight: HighlightSpec | undefined;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (entityId: string) => void;
  onHover: (entityId: string | null) => void;
}) {
  const ref = useRef<Mesh>(null);
  const geometry = useMemo(() => buildPrimitive(part.primitive), [part.primitive]);
  const texture = useMemo(
    () => (highlight ? patternTexture(highlight.pattern) : null),
    [highlight],
  );

  // Lathe and tube profiles already carry absolute coordinates, so translating
  // them again would move them off the figure.
  const absolute = usesAbsoluteCoordinates(part.primitive);
  const position: [number, number, number] = absolute
    ? [0, 0, 0]
    : [part.position[0] * side, part.position[1], part.position[2]];

  const enclosing = ENCLOSING_PARTS.has(part.geometry_key);

  const color = highlight?.colorToken?.startsWith('var(')
    ? undefined
    : (highlight?.colorToken ?? undefined);

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      position={position}
      rotation={[part.rotation[0], part.rotation[1], part.rotation[2] * side]}
      scale={[side, 1, 1]}
      userData={{ entityId: part.entity_id }}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        // Without this the click also reaches whatever sits behind the organ.
        e.stopPropagation();
        onSelect(part.entity_id);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(part.entity_id);
      }}
      onPointerOut={() => onHover(null)}
    >
      <meshStandardMaterial
        color={color ?? (highlight ? '#7aa7d9' : '#9aa7b4')}
        {...(texture ? { map: texture } : {})}
        roughness={0.72}
        metalness={0.03}
        transparent={enclosing}
        opacity={enclosing ? 0.22 : 1}
        depthWrite={!enclosing}
        emissive={isSelected ? '#ffffff' : isHovered ? '#cccccc' : '#000000'}
        emissiveIntensity={isSelected ? 0.28 : isHovered ? 0.14 : 0}
        side={DoubleSide}
      />
    </mesh>
  );
}
