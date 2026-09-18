import { describe, it, expect } from 'vitest';
import { causalQualifier, gateFor } from '@/domain/safety/gating';
import { assertCited, assertNoBannedPatterns } from '@/domain/safety/guards';
import { EvidenceLevel, ReviewStatus, type Provenance } from '@schemas/index';

const PROD = { isProduction: true };

describe('render gating (FR-17)', () => {
  it('keeps in_review content visible — hiding it would blank the app', () => {
    // The seed corpus ships in_review. Gating it out would not be more careful,
    // it would just leave nothing on the page.
    const gate = gateFor('human_observational', 'in_review', PROD);
    expect(gate.visibility).toBe('normal');
    expect(gate.chip).toBe('Pending review');
  });

  it('hides unfinished records in production but shows them loudly in development', () => {
    for (const status of ['draft', 'needs_revision', 'retired'] as const) {
      expect(gateFor('human_established', status, PROD).visibility).toBe('hidden');
      const dev = gateFor('human_established', status, { isProduction: false });
      expect(dev.visibility).toBe('normal');
      expect(dev.prefix).toMatch(/not reviewed/i);
    }
  });

  it('collapses hypothesis and speculative claims behind a mandatory prefix', () => {
    for (const level of ['hypothesis', 'speculative'] as const) {
      const gate = gateFor(level, 'in_review', PROD);
      expect(gate.visibility).toBe('collapsed_by_default');
      expect(gate.requiresExpansion).toBe(true);
      expect(gate.prefix).toBeTruthy();
    }
    // They are collapsed, not hidden: §20 requires the whole spectrum to be visible.
    expect(gateFor('speculative', 'in_review', PROD).visibility).not.toBe('hidden');
  });

  it('requires a species chip on animal and in-vitro findings', () => {
    expect(gateFor('animal', 'in_review', PROD).chip).toBe('Animal studies');
    expect(gateFor('in_vitro', 'in_review', PROD).chip).toBe('Cells / in vitro');
  });

  it('produces a defined gate for all 35 evidence-level × review-status pairs', () => {
    for (const level of EvidenceLevel.options) {
      for (const review of ReviewStatus.options) {
        const gate = gateFor(level, review, PROD);
        expect(['normal', 'collapsed_by_default', 'hidden']).toContain(gate.visibility);
      }
    }
  });

  it('never lets a correlation be phrased as a cause', () => {
    const base = { causal_status: 'correlational_only' } as Provenance;
    expect(causalQualifier(base)).toMatch(/not been shown to be causal/i);
    expect(causalQualifier({ causal_status: 'disputed' } as Provenance)).toMatch(/conflict/i);
    expect(causalQualifier({ causal_status: 'established_causal' } as Provenance)).toBeNull();
  });
});

describe('runtime guards', () => {
  const good: Provenance = {
    evidence_level: 'human_observational',
    causal_status: 'correlational_only',
    review_status: 'in_review',
    confidence: 'moderate',
    citations: [{ source_id: 'SRC-001', supports: 'direct' }],
    uncertainty: {
      description: 'A stated uncertainty of adequate length.',
      known_conflicts: [],
      generalizability: 'population_average',
    },
    reviewed_by: null,
    reviewed_at: null,
    record_version: 1,
  };

  it('throws on an uncited claim', () => {
    expect(() => assertCited('test', { ...good, citations: [] })).toThrow(/no citation/);
  });

  it('throws on a claim with no stated uncertainty', () => {
    expect(() =>
      assertCited('test', { ...good, uncertainty: { ...good.uncertainty, description: '' } }),
    ).toThrow(/no stated uncertainty/);
  });

  it('accepts a properly sourced claim', () => {
    expect(() => assertCited('test', good)).not.toThrow();
  });

  it('throws when prohibited phrasing reaches the output path', () => {
    expect(() => assertNoBannedPatterns('api/x', 'You are now biologically 42.')).toThrow(/SAFETY/);
    expect(() => assertNoBannedPatterns('api/x', 'Muscle mass declines with age.')).not.toThrow();
  });
});
