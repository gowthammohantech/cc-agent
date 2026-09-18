import { test, expect, type Page } from '@playwright/test';

/** The tree renders only expanded branches, so open the path to a node first. */
async function expandTo(page: Page, entityId: string) {
  await page.locator('[data-entity="cardiovascular_system"]').click();
  await page.locator('[data-entity="cardiovascular_system"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.locator(`[data-entity="${entityId}"]`).waitFor();
}

test.describe('body view (P2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/body');
  });

  test('is fully usable by keyboard through the tree', async ({ page }) => {
    const tree = page.getByRole('tree', { name: 'Body structure' });
    await expect(tree).toBeVisible();

    const root = page.locator('[data-entity="organism"]');
    await root.focus();
    await expect(root).toBeFocused();

    // ArrowRight opens, ArrowDown walks into the children.
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-entity]:focus')).not.toHaveAttribute(
      'data-entity',
      'organism',
    );

    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
  });

  test('collapses and expands a branch with left and right arrows', async ({ page }) => {
    const root = page.locator('[data-entity="organism"]');
    await root.focus();
    await expect(root).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('ArrowLeft');
    await expect(root).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('ArrowRight');
    await expect(root).toHaveAttribute('aria-expanded', 'true');
  });

  test('jumps to the ends of the tree with Home and End', async ({ page }) => {
    await page.locator('[data-entity="organism"]').focus();
    await page.keyboard.press('End');
    await expect(page.locator('[data-entity]:focus')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(page.locator('[data-entity="organism"]')).toBeFocused();
  });

  test('always shows the stylization notice', async ({ page }) => {
    await expect(page.getByText(/Stylized schematic/)).toBeVisible();
    await expect(page.getByText(/not anatomically accurate/)).toBeVisible();
  });

  test('keeps the diagram out of the accessibility tree and the list in it', async ({ page }) => {
    // The SVG is exposed as one labelled image, and the real navigation is the
    // tree — so a screen-reader user never has to interrogate a picture.
    const diagram = page.getByRole('img', { name: /Stylized front view/ });
    await expect(diagram).toBeVisible();
    await expect(page.getByRole('tree')).toBeVisible();
  });

  test('announces a selection in a live region', async ({ page }) => {
    await expandTo(page, 'heart');
    await page.locator('[data-entity="heart"]').click();
    await expect(page.locator('[aria-live="polite"]')).toContainText('Selected: Heart');
  });

  test('filters the diagram when a system is chosen', async ({ page }) => {
    await page.getByLabel('System:').selectOption('cardiovascular_system');
    await expect(page.getByRole('img', { name: /cardiovascular system/ })).toBeVisible();
  });

  test('lets the reader force the list view', async ({ page }) => {
    await page.getByRole('radio', { name: 'List' }).check();
    await expect(page.getByText(/Showing the structure list only/)).toBeVisible();
    await expect(page.getByRole('tree')).toBeVisible();
  });
});

test.describe('body view with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('uses the static diagram rather than an animated scene', async ({ page }) => {
    await page.goto('/body');
    await expect(page.getByText(/this view does not rotate/i)).toBeVisible();
  });
});
