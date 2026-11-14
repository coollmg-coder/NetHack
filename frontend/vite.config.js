import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    passWithNoTests: true,
  },
});
