import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ui.ts'],
    include: ['tests/components/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e/**', '**/dist/**', '**/coverage/**'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
