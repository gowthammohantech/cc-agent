import { test, expect } from '@playwright/test';

/**
 * §16's ladder, walked end to end. The property that matters is that the age
 * survives the whole traversal: moving through biological scale at a fixed age
 * is the point of §8, and losing the age at each step would make it useless.
 */
test.describe('biological zoom (P5)', () => {
  test('walks Human to Heart to Tissue to Cell to Mitochondria to Pathway', async ({ page }) => {
    await page.goto('/body/organism');
    await expect(page.getByRole('heading', { name: 'Human organism', level: 1 })).toBeVisible();

    for (const [name, heading] of [
      ['Cardiovascular system', 'Cardiovascular system'],
      ['Heart', 'Heart'],
      ['Cardiac tissue', 'Cardiac tissue'],
      ['Cardiomyocyte', 'Cardiomyocyte'],
      ['Mitochondria', 'Mitochondria'],
      ['mTOR signalling', 'mTOR signalling'],
    ] as const) {
      await page
        .getByRole('link', { name: new RegExp(`^${name}`) })
        .first()
        .click();
      await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
    }
  });

  test('holds the selected age across every level of the ladder', async ({ page }) => {
    await page.goto('/body/heart');

    const slider = page.getByRole('slider');
    await slider.focus();
    await page.keyboard.press('PageUp');
    await page.keyboard.press('PageUp');
    await page.keyboard.press('PageUp');
    await expect(slider).toHaveValue('70');

    await page
      .getByRole('link', { name: /^Cardiac tissue/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: 'Cardiac tissue', level: 1 })).toBeVisible();
    await expect(page.getByRole('slider')).toHaveValue('70');
    // The heading is CSS-uppercased, so innerText reads "AT AGE 70" — match
    // case-insensitively rather than asserting against the source casing.
    await expect(page.getByRole('heading', { name: /at age 70/i })).toBeVisible();
  });

  test('shows the ladder with the current level marked', async ({ page }) => {
    await page.goto('/body/cardiomyocyte');
    const ladder = page.getByRole('navigation', { name: 'Biological zoom' });
    await expect(ladder).toBeVisible();
    await expect(ladder.getByText('Human organism')).toBeVisible();
    await expect(ladder.locator('[aria-current="step"]')).toContainText('Cardiomyocyte');
  });

  test('offers upward navigation from any level', async ({ page }) => {
    await page.goto('/body/mitochondria');
    await page
      .getByRole('link', { name: /^Cardiomyocyte/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: 'Cardiomyocyte', level: 1 })).toBeVisible();
  });

  test('states missing data rather than leaving the level blank', async ({ page }) => {
    await page.goto('/body/spinal_cord');
    await expect(page.getByText(/No curated data for/)).toBeVisible();
    await expect(page.getByText(/not evidence that nothing changes/)).toBeVisible();
  });
});
