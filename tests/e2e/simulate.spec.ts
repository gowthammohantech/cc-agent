import { test, expect } from '@playwright/test';

const BANNER = /SIMULATION — NOT A CLINICAL PREDICTION/;

test.describe('reverse simulation (P8)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/simulate');
  });

  test('shows the §21 banner before any result exists', async ({ page }) => {
    await expect(page.getByText(BANNER)).toBeVisible();
    await expect(page.getByText(/Nothing here recommends, prescribes/)).toBeVisible();
  });

  test('keeps the banner on screen while results are visible', async ({ page }) => {
    await page.getByRole('checkbox').first().check();
    await expect(page.getByRole('heading', { name: /What the model traces/ })).toBeVisible();

    // The banner lives in the layout, so no result can be rendered without it.
    await expect(page.getByText(BANNER)).toBeVisible();
  });

  test('runs a simulation from a selected modification', async ({ page }) => {
    await page.getByLabel(/Reduce cellular senescence/i).check();
    await expect(page.getByRole('heading', { name: /What the model traces/ })).toBeVisible();
    await expect(page.getByText(/Modelled direction/).first()).toBeVisible();
  });

  test('shows where the model stops, with reasons', async ({ page }) => {
    await page.getByLabel(/Reduce cellular senescence/i).check();
    await expect(page.getByRole('heading', { name: /Where the model stops/ })).toBeVisible();
    await expect(
      page.getByText(/does not mean changing one changes the other|records an association/).first(),
    ).toBeVisible();
  });

  test('never renders a biological age or a numeric score', async ({ page }) => {
    await page.getByRole('checkbox').first().check();
    await page.getByRole('checkbox').nth(1).check();

    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/biologically \d/i);
    expect(text).not.toMatch(/your biological age/i);
    expect(text).not.toMatch(/\b\d+%\s*(younger|improvement)/i);
  });

  test('states that whole-organism reversal is not supported', async ({ page }) => {
    await page.getByRole('checkbox').first().check();
    await expect(
      page.getByText(/Not supported\. Nothing in this model bears on whole-organism/),
    ).toBeVisible();
  });

  test('describes its own bounds', async ({ page }) => {
    await page.getByRole('checkbox').first().check();
    await expect(page.getByRole('heading', { name: 'Model bounds' })).toBeVisible();
    await expect(page.getByText(/does not model magnitude, timing, dose/)).toBeVisible();
  });

  test('renders the §49 definitions inline on this page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Seven different claims/ })).toBeVisible();
  });
});

test.describe('simulation API', () => {
  test('returns a safety-checked payload with no magnitude fields', async ({ request }) => {
    const res = await request.post('/api/simulations', {
      data: {
        chronological_age: 70,
        reference_age: 30,
        modifications: [{ target: 'cellular_senescence', direction: 'reduce' }],
      },
    });

    expect(res.status()).toBe(200);
    expect(res.headers()['cache-control']).toContain('no-store');

    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data['whole_organism_claim']).toBe('not_supported');
    expect(body.data['not_a_clinical_prediction']).toBe(true);
    expect(JSON.stringify(body.data)).toMatch(/NOT A CLINICAL PREDICTION/);
    expect(JSON.stringify(body.data)).not.toMatch(
      /"(biological_age|age_estimate|score|percent|magnitude)"/,
    );
  });

  test('is deterministic for the same question', async ({ request }) => {
    const payload = {
      data: {
        chronological_age: 70,
        reference_age: 30,
        modifications: [{ target: 'cellular_senescence', direction: 'reduce' }],
      },
    };
    const a = await (await request.post('/api/simulations', payload)).json();
    const c = await (await request.post('/api/simulations', payload)).json();
    expect(JSON.stringify(a)).toBe(JSON.stringify(c));
  });

  test('rejects an unknown target rather than returning an empty result', async ({ request }) => {
    const res = await request.post('/api/simulations', {
      data: {
        chronological_age: 70,
        reference_age: 30,
        modifications: [{ target: 'not_a_real_node', direction: 'improve' }],
      },
    });
    expect(res.status()).toBe(400);
    expect(await res.text()).toMatch(/No such node/);
  });

  test('rejects a malformed request', async ({ request }) => {
    const res = await request.post('/api/simulations', { data: { chronological_age: 70 } });
    expect(res.status()).toBe(400);
  });
});
