import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/** Tests unitaires (référentiels, validation Zod, helpers). */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
