import { test, expect } from '@playwright/test';

test.describe('evidence mode (P11)', () => {
  test('opens a source drawer from a citation without leaving the page', async ({ page }) => {
    await page.goto('/hallmarks/cellular_senescence');
    const heading = page.getByRole('heading', { name: 'Cellular Senescence', level: 1 });
    await expect(heading).toBeVisible();

    await page
      .getByRole('link', { name: /et al\. \(\d{4}\)/ })
      .first()
      .click();

    await expect(page.getByRole('dialog')).toBeVisible();
    // Still on the same page behind the overlay.
    await expect(heading).toBeVisible();
  });

  test('is shareable and reopens from a pasted URL', async ({ page }) => {
    await page.goto('/hallmarks/cellular_senescence?evidence=SRC-001');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Hallmarks of Aging/ })).toBeVisible();
  });

  test('shows every §24 field, with absence stated rather than blank', async ({ page }) => {
    await page.goto('/hallmarks/cellular_senescence?evidence=SRC-001');
    const dialog = page.getByRole('dialog');

    for (const label of [
      'Authors',
      'Journal',
      'Study type',
      'Species',
      'Population',
      'Sample size',
      'DOI',
      'Last reviewed',
      'Last checked',
    ]) {
      await expect(dialog.getByText(label, { exact: true })).toBeVisible();
    }

    // A missing sample size must read as a statement, never as an empty cell.
    await expect(dialog.getByText('Not applicable / not reported')).toBeVisible();
    await expect(dialog.getByText('Not yet reviewed')).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Limitations' })).toBeVisible();
  });

  test('says plainly that identifiers were not registry-verified', async ({ page }) => {
    await page.goto('/hallmarks/cellular_senescence?evidence=SRC-001');
    await expect(
      page.getByText(/Transcribed, not resolved against a citation registry/),
    ).toBeVisible();
  });

  test('closes with Escape and returns the reader to the page', async ({ page }) => {
    await page.goto('/hallmarks/cellular_senescence?evidence=SRC-001');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page).toHaveURL(/\/hallmarks\/cellular_senescence$/);
  });

  test('closes with the close button', async ({ page }) => {
    await page.goto('/hallmarks/cellular_senescence?evidence=SRC-002');
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('traps focus inside the dialog while it is open', async ({ page }) => {
    await page.goto('/hallmarks/cellular_senescence?evidence=SRC-001');
    await expect(page.getByRole('dialog')).toBeVisible();

    /*
     * <dialog showModal> makes the rest of the document inert. With a single
     * focusable control the cycle is button → body → button, so activeElement
     * is legitimately <body> on alternate presses. The property worth asserting
     * is not "always inside the dialog" but the one that actually matters:
     * focus never reaches an interactive element of the page behind it.
     */
    const escaped: string[] = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const leaked = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        if (el.closest('dialog')) return null;
        return `${el.tagName}: ${(el.textContent ?? '').slice(0, 40)}`;
      });
      if (leaked) escaped.push(leaked);
    }

    expect(escaped, 'focus escaped the modal to page content').toEqual([]);
  });

  test('library lists every source with its study type and species', async ({ page }) => {
    await page.goto('/library');
    await expect(page.getByRole('heading', { name: 'Research library' })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Cell' }).first()).toBeVisible();
    await expect(page.getByText(/not been resolved against a citation registry/)).toBeVisible();
  });

  test('a source page shows its limitations in full', async ({ page }) => {
    await page.goto('/library/SRC-032');
    await expect(page.getByRole('heading', { name: 'Limitations' })).toBeVisible();
    await expect(page.getByText(/progeroid model/i).first()).toBeVisible();
  });
});
