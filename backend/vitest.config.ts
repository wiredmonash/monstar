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
          include: ['src/**/*.service.test.ts'],
          setupFiles: ['src/shared/testing/services.setup.ts'],
        },
      },
      {
        resolve,
        test: {
          ...sharedTest,
          name: 'integration',
          include: [
            'src/domains/**/*.api.test.ts',
            'src/deprecated/**/*.api.test.ts',
          ],
          setupFiles: ['src/shared/testing/integration.setup.ts'],
        },
      },
      {
        resolve,
        test: {
          ...sharedTest,
          name: 'performance',
          include: ['src/shared/testing/performance/*.test.ts'],
          setupFiles: ['src/shared/testing/performance/setup.ts'],
        },
      },
    ],
  },
});
