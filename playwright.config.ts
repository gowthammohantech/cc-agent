import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  ...(process.env['CI'] ? { workers: 2 } : {}),
  reporter: process.env['CI'] ? [['html'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // This image ships a pinned Chromium that may not match the build this
        // Playwright version would download, and the sandbox has no browser-CDN
        // access. Point at the installed binary instead of fetching one.
        // CHROMIUM_PATH lets CI, which does run `playwright install`, opt out.
        launchOptions: {
          ...(process.env['CHROMIUM_PATH'] === 'default'
            ? {}
            : { executablePath: process.env['CHROMIUM_PATH'] ?? '/opt/pw-browsers/chromium' }),
        },
      },
    },
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
