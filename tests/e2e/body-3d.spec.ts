import { test, expect } from '@playwright/test';

/**
 * The image ships SwiftShader, so WebGL genuinely works headlessly here and
 * these assertions exercise the real renderer rather than a stub.
 */
test.describe('three.js body renderer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/body');
    await page.getByRole('radio', { name: '3D' }).check();
  });

  test('mounts a WebGL canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    const size = await canvas.boundingBox();
    expect(size?.width ?? 0).toBeGreaterThan(50);
    expect(size?.height ?? 0).toBeGreaterThan(50);
  });

  test('actually draws something rather than a blank buffer', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // An element screenshot captures the composited frame, which is what the
    // reader actually sees — more faithful than reading the WebGL buffer, and
    // independent of whether the drawing buffer was preserved.
    const shot = await canvas.screenshot();
    expect(shot.byteLength).toBeGreaterThan(1000);

    // A blank canvas compresses to a near-uniform PNG. A drawn figure does not.
    const distinctBytes = new Set(shot.subarray(0, Math.min(shot.length, 20_000))).size;
    expect(distinctBytes, 'canvas appears to be a flat fill').toBeGreaterThan(40);
  });

  test('keeps the canvas out of the accessibility tree', async ({ page }) => {
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    // react-three-fiber marks its own wrapper rather than the canvas element,
    // so assert on the subtree: what matters is that no assistive technology is
    // asked to make sense of a canvas.
    const hidden = await page.evaluate(
      () => document.querySelector('canvas')?.closest('[aria-hidden="true"]') !== null,
    );
    expect(hidden).toBe(true);

    // The tree is how the same content is reached.
    await expect(page.getByRole('tree', { name: 'Body structure' })).toBeVisible();
  });

  test('still shows the stylization notice in 3D', async ({ page }) => {
    await expect(page.getByText(/Stylized schematic/)).toBeVisible();
  });

  test('keeps selection in step between the tree and the scene', async ({ page }) => {
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    await page.locator('[data-entity="cardiovascular_system"]').click();
    await page.locator('[data-entity="cardiovascular_system"]').focus();
    await page.keyboard.press('ArrowRight');
    await page.locator('[data-entity="heart"]').click();

    await expect(page.locator('[aria-live="polite"]')).toContainText('Selected: Heart');
    await expect(page.getByRole('heading', { name: 'Heart' })).toBeVisible();
  });

  test('never auto-rotates', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Let the initial render settle first, so this measures idle behaviour
    // rather than the difference between an empty and a drawn first frame.
    await page.waitForTimeout(1000);
    const before = await canvas.screenshot();
    await page.waitForTimeout(1500);
    const after = await canvas.screenshot();

    // frameloop="demand" plus no autoRotate means an untouched scene is
    // pixel-identical: nothing moves unless the reader moves it, which is both
    // the reduced-motion promise and why an idle page costs no CPU.
    expect(Buffer.compare(before, after)).toBe(0);
  });
});
