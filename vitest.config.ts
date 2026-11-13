import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: ['shared/**/*.test.ts', 'backend/**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/dist/**'],
          environment: 'node',
        },
      },
      'frontend/vite.config.ts',
    ],
  },
});
