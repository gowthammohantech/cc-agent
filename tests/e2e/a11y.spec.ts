import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  '/',
  '/aging',
  '/body',
  '/body/heart',
  '/hallmarks',
  '/hallmarks/cellular_senescence',
  '/compare',
  '/why/cellular_senescence',
  '/network',
  '/rejuvenation',
  '/rejuvenation/targets/target_001',
  '/simulate',
  '/library',
  '/library/SRC-001',
  '/about/methodology',
  '/about/evidence-model',
  '/about/limitations',
] as const;

/**
 * Automated scanning catches roughly a third of real accessibility problems,
 * so this is a floor rather than a pass mark — the manual keyboard and
 * screen-reader passes recorded in docs/ACCESSIBILITY.md are the rest.
 */
test.describe('accessibility sweep', () => {
  for (const route of ROUTES) {
    test(`${route} has no serious or critical violations`, async ({ page }) => {
      await page.goto(route);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations.filter((v) =>
        ['serious', 'critical'].includes(v.impact ?? ''),
      );

      expect(
        blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`),
      ).toEqual([]);
    });
  }
});

test.describe('keyboard reachability', () => {
  test('every primary destination is reachable by keyboard from the home page', async ({
    page,
  }) => {
    await page.goto('/');

    const reachable = new Set<string>();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const href = await page.evaluate(() =>
        document.activeElement instanceof HTMLAnchorElement
          ? document.activeElement.pathname
          : null,
      );
      if (href) reachable.add(href);
    }

    for (const path of ['/aging', '/body', '/hallmarks', '/compare', '/rejuvenation', '/library']) {
      expect([...reachable], `${path} was not tab-reachable`).toContain(path);
    }
  });

  test('the skip link works and is the first stop', async ({ page }) => {
    await page.goto('/aging');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  });
});

test.describe('target size (WCAG 2.5.8)', () => {
  /**
   * Found by a manual keyboard pass, not by axe: navigation links, card titles
   * and control labels were all 16–20px tall. Pinned here so the fixes cannot
   * quietly regress.
   *
   * Two exemptions are honoured rather than papered over: a link inline within
   * a sentence is explicitly exempt under 2.5.8, and the skip link is 1×1 until
   * focused, at which point it is full size.
   */
  for (const route of ['/aging', '/body', '/compare', '/simulate', '/hallmarks', '/rejuvenation']) {
    test(`${route} has no undersized interactive targets`, async ({ page }) => {
      await page.goto(route);

      const undersized = await page.evaluate(() => {
        const focusables = [
          ...document.querySelectorAll('a[href], button, input, select, [tabindex="0"]'),
        ];
        return focusables
          .map((el) => {
            // When a label wraps a control, the label is the real target.
            const target = el.closest('label') ?? el;
            const rect = target.getBoundingClientRect();
            const inlineInSentence = el.tagName === 'A' && el.closest('p') !== null;
            const isSkipLink = el.textContent?.trim() === 'Skip to main content';
            return {
              label: (target.textContent ?? el.tagName).trim().slice(0, 40),
              height: Math.round(rect.height),
              exempt: inlineInSentence || isSkipLink,
            };
          })
          .filter((t) => !t.exempt && t.height > 0 && t.height < 24)
          .map((t) => `${t.label} (${t.height}px)`);
      });

      expect(undersized).toEqual([]);
    });
  }
});
