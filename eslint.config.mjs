import globals from 'globals'
import config from '@rocketseat/eslint-config/node.mjs'

export default [
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
  ...config,
  {
    files: ['**/*.ts'],
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
      }],
    },
  },
  {
    files: [
      '**/*.spec.ts',
      '**/*.e2e-spec.ts',
      'test/**/*.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
  {
    rules: {
      'no-useless-constructor': 'off',
      '@stylistic/max-len': ['warn', {
        code: 100,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignorePattern: '^\\s*import\\s.+$',
      }],
    },
  },
]
