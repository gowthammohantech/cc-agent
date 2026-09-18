import type { Object3D } from 'three';

/**
 * Maps a picked mesh back to the entity it represents.
 *
 * Built from the same body-layout.json that produced the meshes, so picking and
 * the DOM tree cannot drift apart — a structure selectable in one is selectable
 * in the other, by the same id.
 */
export class HitRegistry {
  private readonly byUuid = new Map<string, string>();

  register(object: Object3D, entityId: string): void {
    this.byUuid.set(object.uuid, entityId);
    object.userData['entityId'] = entityId;
  }

  entityFor(object: Object3D | null | undefined): string | null {
    if (!object) return null;
    const direct = this.byUuid.get(object.uuid);
    if (direct) return direct;

    const fromUserData: unknown = object.userData['entityId'];
    if (typeof fromUserData === 'string') return fromUserData;

    // Walk up: three may report a child mesh of a grouped structure.
    return object.parent ? this.entityFor(object.parent) : null;
  }

  clear(): void {
    this.byUuid.clear();
  }

  get size(): number {
    return this.byUuid.size;
  }
}
