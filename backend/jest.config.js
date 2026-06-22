const { _moduleAliases } = require('./package.json');

/**
 * Converts aliases into Jest regex
 *
 * E.g., "@models" -> "^@models/(.*)$" -> "<rootDir>/models/$1"
 */
const makeModuleNameMapper = (aliases) => {
  const mapper = {};

  for (const alias in aliases) {
    const path = aliases[alias];

    // Strip an optional trailing `.js` so explicit-extension requires (e.g.
    // require('@utilities/verifyToken.js')) still resolve to a .ts source.
    const aliasRegex = `^${alias}/(.*?)(?:\\.js)?$`;

    const pathPattern = `<rootDir>/${path.replace(/^\.\//, '')}/$1`;

    mapper[aliasRegex] = pathPattern;
  }
  return mapper;
};

/**
 * Shared config so every project transforms .ts/.js through ts-jest (which also
 * preserves jest.mock hoisting) and resolves .ts before .js.
 */
const common = {
  moduleNameMapper: makeModuleNameMapper(_moduleAliases),
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};

module.exports = {
  testEnvironment: 'node',
  ...common,
  projects: [
    {
      displayName: 'services',
      testMatch: ['<rootDir>/tests/services/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/services/jest.setup.js'],
      ...common,
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/integration/jest.setup.js'],
      ...common,
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/performance/jest.setup.js'],
      ...common,
    },
  ],
};
