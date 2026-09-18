'use client';

import { useSyncExternalStore } from 'react';
import { detectEnvironment, pickRenderer, type RendererPreference } from './pickRenderer';
import type { RendererId } from './BodyRenderer';

/**
 * Environment probing belongs in an external store, not in an effect.
 *
 * The server has no window, so it renders the SVG diagram; the client
 * subscribes to the reduced-motion media query and re-reads on change. Doing
 * this with setState inside an effect would cause a cascading render on every
 * mount and would not react to the user changing their motion preference
 * mid-session.
 */
function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.addEventListener('change', onChange);
  return () => motion.removeEventListener('change', onChange);
}

let cachedKey = '';
let cached: RendererId = 'svg';

function snapshotFor(preference: RendererPreference): RendererId {
  const env = detectEnvironment();
  // useSyncExternalStore requires a referentially stable snapshot between
  // renders, so the resolved value is memoised on its inputs.
  const key = `${preference}|${env.hasWebGL}|${env.prefersReducedMotion}|${env.saveData}|${env.deviceMemory}`;
  if (key !== cachedKey) {
    cachedKey = key;
    cached = pickRenderer(preference, env);
  }
  return cached;
}

export function useResolvedRenderer(preference: RendererPreference): RendererId {
  return useSyncExternalStore(
    subscribe,
    () => snapshotFor(preference),
    () => 'svg' as const,
  );
}
