import { test, expect } from '@playwright/test';

/**
 * The native keyboard behaviour of <input type="range"> is exactly what jsdom
 * cannot simulate, so it is asserted here against a real browser. This is the
 * reason the slider is a native input rather than a custom control.
 */
test.describe('age slider (P1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aging');
  });

  test('steps one year with arrow keys', async ({ page }) => {
    const slider = page.getByRole('slider');
    await slider.focus();
    await expect(slider).toHaveValue('40');

    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('41');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(slider).toHaveValue('39');
  });

  test('steps ten years with Page Up and Page Down', async ({ page }) => {
    const slider = page.getByRole('slider');
    await slider.focus();
    await page.keyboard.press('PageUp');
    await expect(slider).toHaveValue('50');
    await page.keyboard.press('PageDown');
    await expect(slider).toHaveValue('40');
  });

  test('jumps to both ends with Home and End', async ({ page }) => {
    const slider = page.getByRole('slider');
    await slider.focus();
    await page.keyboard.press('Home');
    await expect(slider).toHaveValue('0');
    await page.keyboard.press('End');
    await expect(slider).toHaveValue('100');
  });

  test('moving the slider updates the hallmark panels', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Hallmarks at age 40' })).toBeVisible();

    const slider = page.getByRole('slider');
    await slider.focus();
    await page.keyboard.press('PageUp');
    await page.keyboard.press('PageUp');
    await page.keyboard.press('PageUp');

    await expect(page.getByRole('heading', { name: 'Hallmarks at age 70' })).toBeVisible();
  });

  test('announces the age in words, not just a number', async ({ page }) => {
    const slider = page.getByRole('slider');
    await expect(slider).toHaveAttribute('aria-valuetext', 'Age 40, middle adulthood');
    await slider.focus();
    await page.keyboard.press('End');
    await expect(slider).toHaveAttribute('aria-valuetext', /Age 100/);
  });

  test('renders all twelve hallmark cards at any age', async ({ page }) => {
    await expect(page.getByRole('article')).toHaveCount(12);
    await page.getByRole('slider').focus();
    await page.keyboard.press('Home');
    await expect(page.getByRole('article')).toHaveCount(12);
  });

  test('shows missing data as a stated gap, never as a blank panel', async ({ page }) => {
    await expect(page.getByText(/No curated data at this age for/)).toBeVisible();
    await expect(page.getByText(/not a finding that these systems are unchanged/)).toBeVisible();
  });

  test('warns about sparse data at the top of the range', async ({ page }) => {
    await page.getByRole('slider').focus();
    await page.keyboard.press('End');
    await expect(page.getByText(/sparse/i).first()).toBeVisible();
  });

  test('updates within the perceived-immediate budget (§43)', async ({ page }) => {
    const slider = page.getByRole('slider');
    await slider.focus();

    // Arm a MutationObserver first, then drive a REAL key press. Assigning to
    // el.value would not work here: React tracks the value on the DOM node, so a
    // direct assignment never reaches onChange and the panel would never update.
    await page.evaluate(() => {
      const heading = document.querySelector('#hallmarks-heading');
      if (!heading) throw new Error('hallmarks heading missing');
      const w = window as unknown as { __ageLensUpdate?: Promise<number> };
      w.__ageLensUpdate = new Promise<number>((resolve) => {
        const start = performance.now();
        const observer = new MutationObserver(() => {
          observer.disconnect();
          resolve(performance.now() - start);
        });
        observer.observe(heading, { childList: true, subtree: true, characterData: true });
      });
    });

    await page.keyboard.press('PageUp');

    const elapsed = await page.evaluate(
      () => (window as unknown as { __ageLensUpdate: Promise<number> }).__ageLensUpdate,
    );

    expect(elapsed, `panel update took ${elapsed.toFixed(1)}ms`).toBeLessThan(100);
    await expect(page.getByRole('heading', { name: 'Hallmarks at age 50' })).toBeVisible();
  });
});
