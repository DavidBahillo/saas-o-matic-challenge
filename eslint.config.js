// Reglas de calidad exigidas por docs/constitution.md (principio 7) y CLAUDE.md.
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '.claude/**', 'backend/data/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'max-lines': ['error', { max: 200, skipBlankLines: false }],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: { 'max-lines-per-function': 'off' },
  },
  {
    // Pureza de la regla de precios (spec 002, CA2/RF14, D-P6): ejecutable en el navegador y determinista.
    files: ['shared/src/pricing/**/*.ts'],
    ignores: ['shared/src/pricing/**/*.test.ts'],
    rules: {
      'no-restricted-globals': ['error',
        ...['Date', 'process', 'window', 'document', 'fetch', 'localStorage', 'Intl'].map((name) => ({
          name, message: 'La lógica de precios debe ser pura (RF14).',
        })),
      ],
      'no-restricted-properties': ['error',
        { object: 'Math', property: 'random', message: 'La lógica de precios no usa azar (RF14).' },
      ],
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['node:*'], message: 'La lógica de precios no depende de Node (CA2).' }],
      }],
    },
  },
  {
    // Reglas de los Hooks para la interfaz (spec 005, T2).
    files: ['frontend/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['*.js', '*.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
);
