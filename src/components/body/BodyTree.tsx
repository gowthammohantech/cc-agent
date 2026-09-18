'use client';

/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role --
   The WAI-ARIA tree pattern specifies role="tree" on a <ul> and role="treeitem"
   on each <li>. The strict preset's blanket ban on interactive roles for list
   elements is wrong for this one case; the pattern is implemented in full
   below, including roving tabindex and the complete arrow-key contract. */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { BiologicalEntity } from '@schemas/index';
import { ENTITY_LAYER_LABEL } from '@schemas/index';

export interface TreeNode {
  entity: BiologicalEntity;
  children: TreeNode[];
}

/**
 * The WAI-ARIA tree pattern, and the accessibility baseline for the body view.
 *
 * This is always in the DOM — never display:none, never conditional on the
 * renderer — because the 3D canvas is aria-hidden and a canvas cannot be
 * navigated. Selecting here moves the 3D camera, and clicking in 3D moves focus
 * here, so the two stay in step rather than being alternative products.
 */
export function BodyTree({
  roots,
  selectedId,
  onSelect,
  observationCounts,
}: {
  roots: readonly TreeNode[];
  selectedId: string | null;
  onSelect: (entityId: string) => void;
  observationCounts: ReadonlyMap<string, number>;
}) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(roots.map((r) => r.entity.id)),
  );
  const treeRef = useRef<HTMLUListElement>(null);

  /** Visible nodes in document order — what ArrowUp/ArrowDown walk. */
  const visible = useMemo(() => {
    const out: TreeNode[] = [];
    const walk = (nodes: readonly TreeNode[]) => {
      for (const node of nodes) {
        out.push(node);
        if (expanded.has(node.entity.id)) walk(node.children);
      }
    };
    walk(roots);
    return out;
  }, [roots, expanded]);

  const focusNode = useCallback((entityId: string) => {
    const el = treeRef.current?.querySelector<HTMLElement>(`[data-entity="${entityId}"]`);
    el?.focus();
  }, []);

  const toggle = useCallback((id: string, open: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, node: TreeNode) => {
      const index = visible.findIndex((n) => n.entity.id === node.entity.id);
      const hasChildren = node.children.length > 0;
      const isOpen = expanded.has(node.entity.id);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusNode(visible[Math.min(index + 1, visible.length - 1)]?.entity.id ?? node.entity.id);
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusNode(visible[Math.max(index - 1, 0)]?.entity.id ?? node.entity.id);
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (hasChildren && !isOpen) toggle(node.entity.id, true);
          else if (hasChildren) focusNode(node.children[0]?.entity.id ?? node.entity.id);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (hasChildren && isOpen) toggle(node.entity.id, false);
          else if (node.entity.parent_id) focusNode(node.entity.parent_id);
          break;
        case 'Home':
          event.preventDefault();
          focusNode(visible[0]?.entity.id ?? node.entity.id);
          break;
        case 'End':
          event.preventDefault();
          focusNode(visible.at(-1)?.entity.id ?? node.entity.id);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          onSelect(node.entity.id);
          break;
        default:
          break;
      }
    },
    [visible, expanded, focusNode, toggle, onSelect],
  );

  const renderNodes = (nodes: readonly TreeNode[], level: number) =>
    nodes.map((node) => {
      const id = node.entity.id;
      const hasChildren = node.children.length > 0;
      const isOpen = expanded.has(id);
      const isSelected = selectedId === id;
      const count = observationCounts.get(id) ?? 0;

      return (
        /*
          The WAI-ARIA tree pattern puts role, focus and key handling on the
          treeitem itself, with a single roving tabindex across the tree. A
          nested <button> would be more conventional HTML but would break that
          pattern: it introduces a second focus stop per row and stops arrow
          keys behaving as the tree owner.
        */
        <li
          key={id}
          role="treeitem"
          aria-level={level}
          aria-selected={isSelected}
          {...(hasChildren ? { 'aria-expanded': isOpen } : {})}
          data-entity={id}
          tabIndex={visible[0]?.entity.id === id ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, node)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(id);
          }}
          className="outline-none"
        >
          <span
            className={`flex cursor-pointer items-baseline gap-1.5 rounded px-1.5 py-1 text-sm hover:bg-[var(--color-surface-sunken)] ${
              isSelected ? 'bg-[var(--color-surface-sunken)] font-semibold' : ''
            }`}
            style={{ paddingLeft: `${(level - 1) * 0.85 + 0.375}rem` }}
          >
            {hasChildren && (
              <span aria-hidden="true" className="w-3 text-[var(--color-ink-muted)]">
                {isOpen ? '\u2212' : '+'}
              </span>
            )}
            <span>{node.entity.name}</span>
            <span className="text-xs text-[var(--color-ink-muted)]">
              {ENTITY_LAYER_LABEL[node.entity.layer]}
              {count > 0 ? ` \u00b7 ${count} observation${count === 1 ? '' : 's'}` : ''}
            </span>
          </span>
          {hasChildren && isOpen && <ul role="group">{renderNodes(node.children, level + 1)}</ul>}
        </li>
      );
    });

  return (
    <ul
      ref={treeRef}
      role="tree"
      aria-label="Body structure"
      className="max-h-[32rem] overflow-y-auto rounded border border-[var(--color-line)] p-2"
    >
      {renderNodes(roots, 1)}
    </ul>
  );
}
