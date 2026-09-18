import { test, expect } from '@playwright/test';

test.describe('compare ages (P4)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compare');
  });

  test('is a real table with a caption and row headers', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.locator('caption')).toContainText('Age 30 compared with age 70');
    await expect(table.getByRole('rowheader').first()).toBeVisible();
  });

  test('compares every organ system', async ({ page }) => {
    await expect(page.getByRole('rowheader')).toHaveCount(12);
  });

  test('states why a comparison is impossible rather than leaving it blank', async ({ page }) => {
    await expect(page.getByText('No comparable data').first()).toBeVisible();
    await expect(
      page.getByText(/does not subtract across different measures or populations/),
    ).toBeVisible();
  });

  test('always names the population the comparison applies to', async ({ page }) => {
    await expect(page.getByRole('table').locator('caption')).toContainText(
      'General adult population',
    );
    await expect(
      page.getByRole('heading', { name: /About the general adult population/i }),
    ).toBeVisible();
  });

  test('carries the population caveats with the comparison', async ({ page }) => {
    await expect(page.getByText(/Composite of heterogeneous cohorts/)).toBeVisible();
    await expect(page.getByText(/Sex-stratified differences are real/)).toBeVisible();
  });

  test('recomputes when the ages change', async ({ page }) => {
    await page.getByLabel('Second age').fill('50');
    await expect(page.getByRole('table').locator('caption')).toContainText(
      'Age 30 compared with age 50',
    );
  });

  test('never shows a bare number without its measure and unit', async ({ page }) => {
    // With no curated trajectories, nothing should claim a quantitative delta.
    const text = await page.getByRole('table').innerText();
    expect(text).not.toMatch(/→\s*-?\d+(\.\d+)?\s*$/m);
  });

  test('describes direction in words, not by an arrow alone', async ({ page }) => {
    const qualitative = page.getByText(
      /Lower at the later age|Depends on the tissue|Changes in kind/,
    );
    await expect(qualitative.first()).toBeVisible();
  });
});
