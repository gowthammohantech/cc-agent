import type { CausalStatus, RelationshipType } from '@schemas/index';

/**
 * §46 — "do not communicate scientific state through color alone", applied to
 * graph edges.
 *
 * Causal standing drives the LINE STYLE, not the colour. A reader who cannot
 * distinguish the palette still sees the difference between an established
 * causal edge and a correlation, because one is solid and the other is dotted
 * and carries a text prefix.
 */
export interface EdgeStyle {
  /** SVG stroke-dasharray, or null for a solid line. */
  dashArray: string | null;
  marker: 'none' | 'dot' | 'hatch' | 'question';
  /** Always rendered next to the edge; never optional. */
  textPrefix: string;
}

export const CAUSAL_EDGE_STYLE: Readonly<Record<CausalStatus, EdgeStyle>> = {
  established_causal: { dashArray: null, marker: 'none', textPrefix: 'Established:' },
  supported_mechanistically: { dashArray: null, marker: 'dot', textPrefix: 'Mechanistic:' },
  proposed: { dashArray: '6 4', marker: 'none', textPrefix: 'Proposed:' },
  correlational_only: { dashArray: '2 4', marker: 'none', textPrefix: 'Correlation only:' },
  disputed: { dashArray: '8 4', marker: 'hatch', textPrefix: 'Disputed:' },
  unknown: { dashArray: '2 6', marker: 'question', textPrefix: 'Unknown:' },
};

export const RELATIONSHIP_ARROW: Readonly<Record<RelationshipType, string>> = {
  ASSOCIATED_WITH: 'none',
  CONTRIBUTES_TO: 'arrow',
  ACTIVATES: 'arrow',
  INHIBITS: 'bar',
  DAMAGES: 'arrow',
  REPAIRS: 'arrow',
  CLEARS: 'arrow',
  REGENERATES: 'arrow',
  UNKNOWN_RELATIONSHIP: 'none',
};
