import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    passWithNoTests: true,
    exclude: ['e2e/**', '**/node_modules/**', '**/.git/**'],
  },
});
