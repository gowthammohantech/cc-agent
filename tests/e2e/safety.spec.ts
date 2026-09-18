import { test, expect } from '@playwright/test';

const PROHIBITED = [
  /you are now biologically/i,
  /\breverses aging\b/i,
  /\bcures aging\b/i,
  /clinically proven to/i,
  /anti-?aging (treatment|therapy|product)(?! )/i,
];

const PAGES = ['/', '/aging', '/hallmarks', '/hallmarks/cellular_senescence', '/library'];

test.describe('scientific safety controls (FR-17)', () => {
  test('shows the standing disclaimer on every page', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.getByText(/Educational resource\./)).toBeVisible();
      await expect(page.getByText(/does not estimate any individual/i)).toBeVisible();
    }
  });

  test('shows the pending-review banner on every page', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.getByText(/pending expert review/i)).toBeVisible();
    }
  });

  test('emits no prohibited claim anywhere in the rendered text', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
      for (const pattern of PROHIBITED) {
        // The product states several of these in negated form on purpose, so
        // only an unnegated occurrence is a failure.
        const match = pattern.exec(text);
        if (match) {
          const before = text.slice(Math.max(0, match.index - 40), match.index);
          expect(before, `"${match[0]}" on ${path} without a negator`).toMatch(
            /\b(not|never|no)\b[^.]*$/i,
          );
        }
      }
    }
  });

  test('never renders a biological-age estimate', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(/your biological age is/i);
      expect(text).not.toMatch(/biologically \d{1,3}\b/i);
    }
  });

  test('keeps the evidence badge inspectable rather than a bare score', async ({ page }) => {
    await page.goto('/hallmarks');
    const badge = page.getByRole('button', { name: /Evidence level/i }).first();
    await expect(badge).toHaveAttribute('aria-expanded', 'false');
    await badge.click();
    await expect(badge).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(/deliberately not combined into a single score/i)).toBeVisible();
    await expect(page.getByText('Species relevance:').first()).toBeVisible();
  });
});
