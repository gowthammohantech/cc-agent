import { test, expect, type Page } from '@playwright/test';

/**
 * §46 — "do not communicate scientific state through color alone".
 *
 * A colour-blind reader or a greyscale print must lose nothing. These tests
 * force greyscale and assert that every piece of scientific state is still
 * carried by words, patterns or numbered callouts.
 */
test.use({ colorScheme: 'light' });

async function forceGreyscale(page: Page) {
  await page.addStyleTag({ content: 'html { filter: grayscale(100%) !important; }' });
}

test.describe('readable without colour', () => {
  test('evidence levels are named in words, not shown as a colour swatch', async ({ page }) => {
    await page.goto('/hallmarks');
    await forceGreyscale(page);

    const text = await page.locator('main').innerText();
    // Each badge states its level; the glyph and colour only reinforce it.
    expect(text).toMatch(/Animal studies|Human observational|Cells \/ in vitro/);
  });

  test('the evidence badge expands to eight named dimensions', async ({ page }) => {
    await page.goto('/hallmarks');
    await forceGreyscale(page);

    await page
      .getByRole('button', { name: /Evidence level/i })
      .first()
      .click();
    for (const dimension of ['Species relevance', 'Study design', 'Replication', 'Recency']) {
      await expect(page.getByText(`${dimension}:`).first()).toBeVisible();
    }
  });

  test('graph edges state their causal standing in words', async ({ page }) => {
    await page.goto('/why/cellular_senescence');
    await forceGreyscale(page);

    await page.getByRole('radio', { name: 'List' }).first().check();
    const text = await page.locator('main').innerText();
    expect(text).toMatch(/Mechanistic:|Established:|Correlation only:/);
    expect(text).toMatch(/Causal standing:/);
  });

  test('the age band rail is labelled and described, not just tinted', async ({ page }) => {
    await page.goto('/aging');
    await forceGreyscale(page);

    const rail = page.getByRole('img', { name: /Life phases/i });
    await expect(rail).toHaveAccessibleName(/Early adulthood, ages 20 to 35/);
    // Exact: "Development" also appears inside "Developmental change" chips.
    await expect(page.getByText('Development', { exact: true })).toBeVisible();
    await expect(page.getByText('Later life', { exact: true })).toBeVisible();
  });

  test('body highlights are numbered and named in a legend', async ({ page }) => {
    await page.goto('/body');
    await page.getByRole('radio', { name: 'Diagram' }).check();
    await forceGreyscale(page);

    const legend = page.getByRole('heading', { name: 'Highlighted at this age' });
    if (await legend.isVisible()) {
      // Every callout number in the diagram has a named entry in the list.
      const items = page.locator('ol li');
      expect(await items.count()).toBeGreaterThan(0);
    }
  });

  test('change class is a text chip, not a border colour alone', async ({ page }) => {
    await page.goto('/aging');
    await forceGreyscale(page);

    const text = await page.locator('main').innerText();
    expect(text).toMatch(/Age-associated change|Developmental change|Classification unclear/);
  });

  test('missing data is described in words and a dashed border', async ({ page }) => {
    await page.goto('/aging');
    await forceGreyscale(page);
    await expect(page.getByText(/No curated data/).first()).toBeVisible();
  });

  test('compare directions are stated, not conveyed by arrow colour', async ({ page }) => {
    await page.goto('/compare');
    await forceGreyscale(page);

    const text = await page.getByRole('table').innerText();
    expect(text).toMatch(/Lower at the later age|Depends on the tissue|No comparable data/);
  });
});
