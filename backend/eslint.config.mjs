import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  // Global ignores
  {
    ignores: [
      'eslint.config.mjs',
      'vitest.config.ts',
      'node_modules/',
      'dist/',
      'build/',
      'src/**/*.test.ts',
      'src/shared/testing/',
    ],
  },
  // Configuration for CommonJS files (.js, .cjs)
  {
    files: ['**/*.js', '**/*.cjs'],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      globals: globals.node,
      sourceType: 'commonjs',
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-in modules
            'external', // npm packages
            'internal', // @alias imports
            'parent', // ../
            'sibling', // ./
            'index', // ./index
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.mjs', '.cjs'],
        },
      },
      'import/internal-regex':
        '^@(domains|infrastructure|shared|deprecated|docs)/',
    },
  },
  // Configuration for TypeScript files (type-aware)
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/await-thenable': 'error',
    },
  },
  prettierConfig
);
