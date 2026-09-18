import { test, expect } from '@playwright/test';

/**
 * launchOptions forces its own worker, so this lives in a separate file.
 *
 * The point of the whole renderer abstraction is that losing WebGL loses
 * nothing: the same entities, the same selection behaviour, the same content.
 */
test.use({
  launchOptions: {
    executablePath: process.env['CHROMIUM_PATH'] ?? '/opt/pw-browsers/chromium',
    args: ['--disable-gpu', '--disable-webgl', '--disable-webgl2'],
  },
});

test('body view degrades to the diagram with WebGL disabled', async ({ page }) => {
  await page.goto('/body');

  await expect(page.getByRole('img', { name: /Stylized front view/ })).toBeVisible();
  await expect(page.getByRole('tree', { name: 'Body structure' })).toBeVisible();
  await expect(page.getByText(/Stylized schematic/)).toBeVisible();

  // Every structure is still reachable and selectable without WebGL.
  await page.locator('[data-entity="cardiovascular_system"]').click();
  await page.locator('[data-entity="cardiovascular_system"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.locator('[data-entity="heart"]').click();
  await expect(page.locator('[aria-live="polite"]')).toContainText('Selected: Heart');
});
