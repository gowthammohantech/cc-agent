import { CanvasTexture, RepeatWrapping, type Texture } from 'three';
import type { HighlightSpec } from '../renderer/BodyRenderer';

/**
 * §46 in the 3D view: state must not be carried by colour alone.
 *
 * Each highlight pattern becomes a procedurally drawn texture, so a structure
 * marked by strong human evidence is visibly denser than one marked by a
 * hypothesis even in greyscale. Colour is applied on top as reinforcement.
 */
const cache = new Map<string, Texture>();

export function patternTexture(pattern: HighlightSpec['pattern']): Texture | null {
  if (pattern === 'solid') return null;
  if (typeof document === 'undefined') return null;

  const hit = cache.get(pattern);
  if (hit) return hit;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(0,0,0,0.42)';
  ctx.fillStyle = 'rgba(0,0,0,0.42)';

  switch (pattern) {
    case 'hatch':
      ctx.lineWidth = 2;
      for (let i = -size; i < size * 2; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.stroke();
      }
      break;

    case 'cross-hatch':
      ctx.lineWidth = 1.5;
      for (let i = -size; i < size * 2; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.moveTo(i + size, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
      }
      break;

    case 'dots':
      for (let x = 6; x < size; x += 12) {
        for (let y = 6; y < size; y += 12) {
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;

    case 'sparse-dots':
      for (let x = 12; x < size; x += 24) {
        for (let y = 12; y < size; y += 24) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  // A coarse repeat turns the pattern into the subject of the image rather
  // than a property of the surface; this keeps it legible but subordinate.
  texture.repeat.set(14, 14);
  cache.set(pattern, texture);
  return texture;
}

export function clearPatternCache(): void {
  for (const t of cache.values()) t.dispose();
  cache.clear();
}
