import { defineConfig } from 'vitest/config';

const sharedTest = {
  globals: true,
  environment: 'node' as const,
  testTimeout: 30000,
  hookTimeout: 30000,
};

const resolve = { tsconfigPaths: true };

export default defineConfig({
  test: {
    projects: [
      {
        resolve,
        test: {
          ...sharedTest,
          name: 'services',
          include: ['tests/services/*.test.ts'],
          setupFiles: ['tests/services/setup.ts'],
        },
      },
      {
        resolve,
        test: {
          ...sharedTest,
          name: 'integration',
          include: ['tests/integration/*.test.ts'],
          setupFiles: ['tests/integration/setup.ts'],
        },
      },
      {
        resolve,
        test: {
          ...sharedTest,
          name: 'performance',
          include: ['tests/performance/*.test.ts'],
          setupFiles: ['tests/performance/setup.ts'],
        },
      },
    ],
  },
});
