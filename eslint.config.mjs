import js from '@eslint/js';
import globals from 'globals';

const sharedRules = {
  'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
  'prefer-const': 'error',
  'no-var': 'error',
  eqeqeq: ['error', 'always'],
  curly: ['error', 'all'],
  'no-implicit-globals': 'error',
};

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    // Extension code runs as classic scripts. The lib/ files also export through
    // `module.exports` when loaded by the Node tests.
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        chrome: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: sharedRules,
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: sharedRules,
  },
];
