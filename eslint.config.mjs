import next from 'eslint-config-next'

// Next 16's `eslint-config-next` ships a native ESLint flat-config array
// (core-web-vitals + typescript rules, parser, and plugins), so it is spread
// in directly — no FlatCompat shim.
const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  ...next,
]

export default eslintConfig
