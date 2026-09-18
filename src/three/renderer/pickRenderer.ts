import type { RendererId } from './BodyRenderer';

export interface RendererEnvironment {
  hasWebGL: boolean;
  prefersReducedMotion: boolean;
  saveData: boolean;
  deviceMemory: number;
}

export type RendererPreference = RendererId | 'auto';

/**
 * Chooses a renderer, but an explicit user choice always wins.
 *
 * Reduced motion falls back to the static SVG diagram rather than to a
 * motionless 3D scene: a WebGL canvas the user cannot rotate is worse than a
 * diagram that was never going to move, and it still costs them the download.
 */
export function pickRenderer(preference: RendererPreference, env: RendererEnvironment): RendererId {
  if (preference !== 'auto') return preference;
  if (!env.hasWebGL) return 'svg';
  if (env.prefersReducedMotion) return 'svg';
  if (env.saveData) return 'svg';
  if (env.deviceMemory > 0 && env.deviceMemory < 2) return 'svg';
  return 'three';
}

export function detectEnvironment(): RendererEnvironment {
  if (typeof window === 'undefined') {
    return { hasWebGL: false, prefersReducedMotion: false, saveData: false, deviceMemory: 0 };
  }

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };

  return {
    hasWebGL: hasWebGLSupport(),
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: nav.connection?.saveData === true,
    deviceMemory: nav.deviceMemory ?? 0,
  };
}

function hasWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    // A browser that throws on context creation is one we should not hand a
    // canvas to, so treat any failure as "no WebGL" rather than propagating.
    return false;
  }
}
