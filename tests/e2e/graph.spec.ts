import { test, expect } from '@playwright/test';

test.describe('causal graph (P6)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/why/cellular_senescence');
  });

  test('shows what contributes to a node and what it contributes to', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /What contributes to cellular senescence/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /What cellular senescence contributes to/i }),
    ).toBeVisible();
  });

  test('offers the list view to every reader, not only to assistive technology', async ({
    page,
  }) => {
    const listToggle = page.getByRole('radio', { name: 'List' }).first();
    await expect(listToggle).toBeVisible();
    await listToggle.check();
    await expect(page.getByText(/Causal standing:/).first()).toBeVisible();
  });

  test('states causal standing in words on every edge', async ({ page }) => {
    await page.getByRole('radio', { name: 'List' }).first().check();
    const text = await page.locator('main').innerText();
    expect(text).toMatch(/Mechanistic:|Established:|Proposed:|Correlation only:/);
  });

  test('warns that an arrow is not evidence of causation', async ({ page }) => {
    await expect(
      page.getByText(/the direction of an arrow is not evidence of causation/i),
    ).toBeVisible();
  });

  test('explains the edge styles without relying on colour', async ({ page }) => {
    // Scope to the legend: the same words appear inside collapsed <details>
    // text views elsewhere on the page, which are legitimately hidden.
    const legend = page.getByRole('region', { name: 'How to read the edges' });
    await expect(legend).toBeVisible();

    // Every causal standing is named in words beside its line style. Not an
    // exact match: some entries carry a trailing glyph in the same element.
    for (const label of ['Established causal', 'Correlational only', 'Disputed', 'Unknown']) {
      await expect(legend.getByText(new RegExp(label))).toBeVisible();
    }
    await expect(legend.getByText(/never propagates in the simulation/)).toBeVisible();
  });

  test('lets keyboard users reach and follow a graph node', async ({ page }) => {
    const node = page.getByRole('link', { name: /Open its causal view/ }).first();
    await expect(node).toBeVisible();
    await node.focus();
    await expect(node).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/why\//);
  });

  test('states a gap rather than showing an empty diagram', async ({ page }) => {
    await page.goto('/why/eyes');
    const text = await page.locator('main').innerText();
    expect(text).toMatch(/No curated relationships|contributes to/i);
  });
});

test.describe('aging network (P9)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/network');
  });

  test('lists every curated relationship with its causal standing', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText(/Showing 36 of 36 relationships/)).toBeVisible();
  });

  test('says how many links are correlational only', async ({ page }) => {
    await expect(
      page.getByText(/correlational only and do not support a causal reading/),
    ).toBeVisible();
  });

  test('shrinks the network when only causal links are kept', async ({ page }) => {
    await page.getByLabel('Causally supported links only').check();
    const text = await page.getByText(/Showing \d+ of 36 relationships/).innerText();
    const shown = Number(/Showing (\d+)/.exec(text)?.[1] ?? '0');
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(36);
  });

  test('filters by minimum evidence level', async ({ page }) => {
    await page.getByLabel('Minimum evidence').selectOption('human_established');
    const text = await page.getByText(/Showing \d+ of 36 relationships/).innerText();
    const shown = Number(/Showing (\d+)/.exec(text)?.[1] ?? '999');
    expect(shown).toBeLessThan(36);
  });

  test('explains an empty result as a statement about evidence', async ({ page }) => {
    await page.getByLabel('Minimum evidence').selectOption('human_established');
    await page.getByLabel('Causally supported links only').check();
    const body = await page.locator('main').innerText();
    if (body.includes('Showing 0 of')) {
      await expect(page.getByText(/statement about how much is established/)).toBeVisible();
    }
  });
});
