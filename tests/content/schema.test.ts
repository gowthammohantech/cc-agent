import { describe, it, expect } from 'vitest';
import { getBundle } from '@/content/bundle';
import { checkReferentialIntegrity, checkCoverage } from '@/content/integrity';

describe('content corpus', () => {
  it('parses against every schema', () => {
    expect(() => getBundle()).not.toThrow();
  });

  it('has no dangling references, duplicate ids or tree defects', () => {
    expect(checkReferentialIntegrity(getBundle()).map((p) => `[${p.kind}] ${p.message}`)).toEqual(
      [],
    );
  });

  it('meets the coverage floors that keep the core from rendering empty', () => {
    expect(checkCoverage(getBundle()).map((p) => `[${p.kind}] ${p.message}`)).toEqual([]);
  });

  it('carries all twelve hallmarks of the 2023 framework', () => {
    const b = getBundle();
    expect(b.hallmarks).toHaveLength(12);
    expect(new Set(b.hallmarks.map((h) => h.framework.version))).toEqual(new Set(['2023']));
  });

  it('describes all seven §49 rejuvenation scopes', () => {
    const defs = getBundle().rejuvenationDefinitions.definitions;
    expect(defs).toHaveLength(7);
    expect(defs.map((d) => d.scope)).toEqual([
      'functional',
      'cellular',
      'molecular_epigenetic',
      'tissue',
      'organ',
      'systemic',
      'whole_organism',
    ]);
  });
});
