import type { ContentBundle } from '@/content/bundle';
import type { TreeNode } from './BodyTree';

/** Materialises the entity hierarchy for the tree, name-sorted at every level. */
export function buildEntityTree(bundle: ContentBundle): TreeNode[] {
  const build = (id: string): TreeNode | null => {
    const entity = bundle.indexes.entityById.get(id);
    if (!entity) return null;
    return {
      entity,
      children: (bundle.indexes.childrenOf.get(id) ?? [])
        .map(build)
        .filter((n): n is TreeNode => n !== null),
    };
  };

  const root = build('organism');
  return root ? [root] : [];
}
