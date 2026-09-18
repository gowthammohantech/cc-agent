'use client';

import { Suspense } from 'react';
import type { Study } from '@schemas/index';
import { EvidenceDrawer } from './EvidenceDrawer';

/**
 * useSearchParams suspends during prerender, so the drawer is wrapped in its
 * own Suspense boundary. Without it, every page hosting the drawer would be
 * forced out of static rendering by an overlay that is closed by default.
 */
export function EvidenceDrawerHost({ studies }: { studies: Readonly<Record<string, Study>> }) {
  return (
    <Suspense fallback={null}>
      <EvidenceDrawer studies={studies} />
    </Suspense>
  );
}
