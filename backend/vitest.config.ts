import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e.spec.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 30000,
    deps: {
      optimizer: {
        ssr: {
          exclude: [/node_modules/],
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.e2e.spec.ts',
        '**/*.test.ts',
        '**/main.ts',
      ],
    },
    setupFiles: ['reflect-metadata'],
    pool: 'forks',
  },
  plugins: [swc.vite()],
  css: {
    postcss: null,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
