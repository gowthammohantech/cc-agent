import next from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import local from './eslint-rules/index.mjs';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },

  ...next,

  // Strict a11y, not merely "recommended" — accessibility is a stated product
  // requirement (§46), so violations are errors. eslint-config-next already
  // registers the jsx-a11y plugin, so take the strict ruleset only; redefining
  // the plugin is a hard config error.
  { rules: { ...jsxA11y.flatConfigs.strict.rules } },

  ...tseslint.configs.recommendedTypeChecked,

  // Config files and the custom lint rule live outside the TS project, so
  // type-aware linting cannot resolve them.
  {
    files: ['**/*.mjs', '**/*.mts', '**/*.cjs', '**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    plugins: { local },
    rules: {
      'local/require-evidence-prop': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Scripts are CLI tools: they print and they exit.
  {
    files: ['scripts/**/*.ts', 'tests/**/*.ts', 'tests/**/*.tsx', '*.config.*'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
);
