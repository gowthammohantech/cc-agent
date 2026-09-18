'use client';

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { EntityLayer } from '@schemas/index';

export type RendererId = 'auto' | 'three' | 'svg' | 'dom';

interface AppState {
  /**
   * §43 — the age is held twice on purpose.
   *
   * `ageDraft` follows the pointer during a drag and is read only by the slider
   * itself; `age` is the committed value every panel subscribes to, set inside
   * a transition so React can interrupt heavy panel work while the thumb stays
   * glued to the cursor. Collapsing these into one value is what makes a slider
   * feel laggy under a dozen subscribed views.
   */
  ageDraft: number;
  age: number;
  populationId: string;

  selectedEntityId: string | null;
  hoveredEntityId: string | null;
  selectedLayer: EntityLayer | null;
  selectedSystemId: string | null;

  compareAgeA: number;
  compareAgeB: number;

  rendererPreference: RendererId;

  setAgeDraft: (age: number) => void;
  commitAge: (age: number) => void;
  setPopulation: (id: string) => void;
  select: (entityId: string | null) => void;
  hover: (entityId: string | null) => void;
  selectSystem: (systemId: string | null) => void;
  setCompareAges: (a: number, b: number) => void;
  setRendererPreference: (r: RendererId) => void;
}

export const MIN_SLIDER_AGE = 0;
export const MAX_SLIDER_AGE = 100;

export const useAppStore = create<AppState>((set) => ({
  ageDraft: 40,
  age: 40,
  populationId: 'general_adult',

  selectedEntityId: null,
  hoveredEntityId: null,
  selectedLayer: null,
  selectedSystemId: null,

  compareAgeA: 30,
  compareAgeB: 70,

  rendererPreference: 'auto',

  setAgeDraft: (ageDraft) => set({ ageDraft }),
  commitAge: (age) => set({ age, ageDraft: age }),
  setPopulation: (populationId) => set({ populationId }),
  select: (selectedEntityId) => set({ selectedEntityId }),
  hover: (hoveredEntityId) => set({ hoveredEntityId }),
  selectSystem: (selectedSystemId) => set({ selectedSystemId, selectedEntityId: selectedSystemId }),
  setCompareAges: (compareAgeA, compareAgeB) => set({ compareAgeA, compareAgeB }),
  setRendererPreference: (rendererPreference) => set({ rendererPreference }),
}));

/** Subscribe to the committed age only — a drag does not re-render the caller. */
export function useCommittedAge(): number {
  return useAppStore((s) => s.age);
}

export function useSelection(): {
  selectedEntityId: string | null;
  hoveredEntityId: string | null;
} {
  return useAppStore(
    useShallow((s) => ({
      selectedEntityId: s.selectedEntityId,
      hoveredEntityId: s.hoveredEntityId,
    })),
  );
}
