import { describe, it, expect } from 'vitest';
import { pickRenderer, type RendererEnvironment } from '@/three/renderer/pickRenderer';
import { instancesOf, partsForSystem, RENDERER_CAPABILITIES } from '@/three/renderer/BodyRenderer';
import { getBundle } from '@/content/bundle';

const capable: RendererEnvironment = {
  hasWebGL: true,
  prefersReducedMotion: false,
  saveData: false,
  deviceMemory: 8,
};

describe('renderer selection', () => {
  it('uses 3D when the environment supports it', () => {
    expect(pickRenderer('auto', capable)).toBe('three');
  });

  it('falls back to the diagram without WebGL', () => {
    expect(pickRenderer('auto', { ...capable, hasWebGL: false })).toBe('svg');
  });

  it('falls back to the diagram under reduced motion', () => {
    // A 3D scene the reader cannot rotate is worse than a diagram that was
    // never going to move, and it still costs them the download.
    expect(pickRenderer('auto', { ...capable, prefersReducedMotion: true })).toBe('svg');
  });

  it('falls back on save-data and low-memory devices', () => {
    expect(pickRenderer('auto', { ...capable, saveData: true })).toBe('svg');
    expect(pickRenderer('auto', { ...capable, deviceMemory: 1 })).toBe('svg');
    expect(pickRenderer('auto', { ...capable, deviceMemory: 0 })).toBe('three'); // unreported
  });

  it('always honours an explicit choice over any heuristic', () => {
    expect(pickRenderer('three', { ...capable, hasWebGL: false })).toBe('three');
    expect(pickRenderer('dom', capable)).toBe('dom');
    expect(pickRenderer('svg', capable)).toBe('svg');
  });

  it('declares what each renderer can do', () => {
    expect(RENDERER_CAPABILITIES.three.rotate).toBe(true);
    expect(RENDERER_CAPABILITIES.svg.rotate).toBe(false);
    expect(RENDERER_CAPABILITIES.dom.depth).toBe(false);
  });
});

describe('body layout', () => {
  const layout = getBundle().bodyLayout;

  it('covers every organ system with at least one drawable part', () => {
    const systems = new Set(layout.parts.map((p) => p.system_id));
    expect(systems.size).toBeGreaterThanOrEqual(12);
  });

  it('filters parts to one system, in stable draw order', () => {
    const cardio = partsForSystem(layout, 'cardiovascular_system');
    expect(cardio.length).toBeGreaterThan(0);
    expect(cardio.every((p) => p.system_id === 'cardiovascular_system')).toBe(true);

    const keys = cardio.map((p) => p.geometry_key);
    expect(partsForSystem(layout, 'cardiovascular_system').map((p) => p.geometry_key)).toEqual(
      keys,
    );
  });

  it('expands mirrored parts into two instances with opposite sides', () => {
    const lung = layout.parts.find((p) => p.geometry_key === 'lung');
    expect(lung?.mirror_x).toBe(true);
    const instances = instancesOf(lung!);
    expect(instances).toHaveLength(2);
    expect(instances.map((i) => i.side).sort()).toEqual([-1, 1]);
    expect(new Set(instances.map((i) => i.key)).size).toBe(2);
  });

  it('leaves unmirrored parts as a single instance', () => {
    const heart = layout.parts.find((p) => p.geometry_key === 'heart');
    expect(instancesOf(heart!)).toHaveLength(1);
  });

  it('carries a stylization notice that says it is not anatomical', () => {
    expect(layout.stylization_notice).toMatch(/not anatomically accurate/i);
  });
});
