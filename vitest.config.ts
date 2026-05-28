import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // TypeScript NodeNext convention: source imports use `.js` extensions but
    // the actual files are `.ts`. Tell vitest to try `.ts` first when resolving.
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
  },
  test: {
    include: ['server/src/**/*.test.ts'],
    environment: 'node',
  },
});
