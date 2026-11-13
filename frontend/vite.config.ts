import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { createProxyConfig } from './proxy-config';

export default defineConfig({
  plugins: [react()],
  server: { proxy: createProxyConfig({ BACKEND_URL: process.env.BACKEND_URL }) },
  test: {
    name: 'frontend',
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    globalSetup: ['./src/test/global-setup.ts'],
  },
});
