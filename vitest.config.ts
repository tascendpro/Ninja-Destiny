import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Les composants React (tests d'affichage) : le JSX moderne, sans import de React.
  esbuild: { jsx: 'automatic' },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'node',
    testTimeout: 60000,
  },
});
