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

    const aliasRegex = `^${alias}/(.*)$`;

    const pathPattern = `<rootDir>/${path.replace(/^\.\//, '')}/$1`;

    mapper[aliasRegex] = pathPattern;
  }
  return mapper;
};

module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: makeModuleNameMapper(_moduleAliases),
  projects: [
    {
      displayName: 'services',
      testMatch: ['<rootDir>/tests/services/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/services/jest.setup.js'],
      moduleNameMapper: makeModuleNameMapper(_moduleAliases),
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/integration/jest.setup.js'],
      moduleNameMapper: makeModuleNameMapper(_moduleAliases),
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/performance/jest.setup.js'],
      moduleNameMapper: makeModuleNameMapper(_moduleAliases),
    },
  ],
};
