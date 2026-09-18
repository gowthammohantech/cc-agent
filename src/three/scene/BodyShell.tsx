'use client';

import { useMemo } from 'react';
import { DoubleSide } from 'three';
import type { BodyPart } from '@schemas/index';
import { buildPrimitive, usesAbsoluteCoordinates } from '../geometry/build';
import { instancesOf } from '../renderer/BodyRenderer';

/**
 * The translucent outer body.
 *
 * Kept at low opacity with depthWrite off so the organ layers inside stay
 * visible — the interior is where the interest is, and a solid mannequin would
 * hide all of it. `raycast` is disabled entirely rather than relying on event
 * ordering, which is the simplest correct way to stop the shell swallowing
 * clicks meant for an organ.
 */
export function BodyShell({ shell }: { shell: readonly BodyPart[] }) {
  const meshes = useMemo(() => shell.flatMap((part) => instancesOf(part)), [shell]);

  return (
    <group>
      {meshes.map(({ part, side, key }) => {
        const absolute = usesAbsoluteCoordinates(part.primitive);
        return (
          <mesh
            key={key}
            geometry={buildPrimitive(part.primitive)}
            position={
              absolute ? [0, 0, 0] : [part.position[0] * side, part.position[1], part.position[2]]
            }
            rotation={[part.rotation[0], part.rotation[1], part.rotation[2] * side]}
            scale={[side, 1, 1]}
            raycast={() => null}
          >
            <meshStandardMaterial
              color="#b9c4cf"
              transparent
              opacity={0.18}
              depthWrite={false}
              roughness={0.9}
              side={DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}
