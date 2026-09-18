import { test, expect } from '@playwright/test';

test.describe('rejuvenation explorer (P7)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rejuvenation');
  });

  test('states the systemic caveat before listing any target (§19)', async ({ page }) => {
    const caveat = page.getByText(/Improving one biological dimension does not establish/);
    await expect(caveat).toBeVisible();

    // Position matters: a list of targets reads as a checklist of solvable
    // problems unless this comes first.
    const caveatBox = await caveat.boundingBox();
    const firstTarget = await page.getByRole('article').first().boundingBox();
    expect(caveatBox?.y ?? 0).toBeLessThan(firstTarget?.y ?? 0);
  });

  test('renders all seven §49 definitions, each with what it does not mean', async ({ page }) => {
    const panel = page.getByRole('region', { name: /Seven different claims/ });
    await expect(panel).toBeVisible();

    for (const name of [
      'Functional rejuvenation',
      'Cellular rejuvenation',
      'Molecular / epigenetic rejuvenation',
      'Tissue rejuvenation',
      'Organ rejuvenation',
      'Systemic rejuvenation',
      'Whole-organism age reversal',
    ]) {
      await expect(panel.getByRole('heading', { name: new RegExp(name) })).toBeVisible();
    }
    await expect(panel.getByText('What it does not mean:').first()).toBeVisible();
  });

  test('says plainly that nothing here meets the whole-organism standard', async ({ page }) => {
    await expect(
      page.getByText(/No approach in this application meets this standard/),
    ).toBeVisible();
  });

  test('shows risks and unknowns on every target card, not behind a link', async ({ page }) => {
    const cards = page.getByRole('article');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).getByRole('heading', { name: /Risks \(\d+\)/ })).toBeVisible();
      await expect(cards.nth(i).getByRole('heading', { name: /Unknowns \(\d+\)/ })).toBeVisible();
    }
  });

  test('tracks reversibility per species and never merges them', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table.getByRole('columnheader', { name: 'In cells' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'In animals' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'In humans' })).toBeVisible();
    await expect(table.locator('caption')).toContainText(
      'a result in mice is not a result in people',
    );
  });

  test('claims no human demonstration anywhere in the matrix', async ({ page }) => {
    // The corpus must not assert a demonstrated human reversal.
    const rows = page.getByRole('table').getByRole('row');
    const count = await rows.count();
    for (let i = 1; i < count; i++) {
      const cells = rows.nth(i).getByRole('cell');
      const humans = await cells.nth(2).innerText();
      expect(humans).not.toBe('Demonstrated');
    }
  });

  test('carries the not-medical-advice notice from the layout', async ({ page }) => {
    await expect(page.getByText(/Nothing here recommends, prescribes, or endorses/)).toBeVisible();
  });
});

test.describe('rejuvenation target detail', () => {
  test('materialises §18 seven-step chain in order', async ({ page }) => {
    await page.goto('/rejuvenation/targets/target_001');

    const steps = page.getByRole('heading', { level: 3 });
    await expect(steps.filter({ hasText: 'Observed age-associated state' })).toBeVisible();
    await expect(steps.filter({ hasText: 'Candidate biological target' })).toBeVisible();
    await expect(steps.filter({ hasText: 'Research approaches' })).toBeVisible();
    await expect(steps.filter({ hasText: 'Known risks' })).toBeVisible();
    await expect(steps.filter({ hasText: 'Unknowns' }).first()).toBeVisible();
  });

  test('treats an absent evidence class as a finding, not an oversight', async ({ page }) => {
    // target_002 has no human evidence in this corpus.
    await page.goto('/rejuvenation/targets/target_002');
    await expect(page.getByText(/An empty section here is a real finding/).first()).toBeVisible();
  });

  test('repeats the systemic caveat at the end of the detail page', async ({ page }) => {
    await page.goto('/rejuvenation/targets/target_003');
    await expect(
      page.getByText(/does not establish whole-organism rejuvenation/).first(),
    ).toBeVisible();
  });
});
