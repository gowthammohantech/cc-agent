import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': r('./src'),
      '@schemas': r('./schemas'),
      '@content': r('./content'),
    },
  },
  test: {
    // Default is node; component tests opt into jsdom with a
    // `// @vitest-environment jsdom` docblock (environmentMatchGlobs was
    // removed in Vitest 5).
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/domain/**', 'src/content/**', 'schemas/**'],
      thresholds: {
        'src/domain/**': { lines: 90, functions: 90, branches: 80, statements: 90 },
      },
    },
  },
});
