import { FlatCompat } from '@eslint/eslintrc';

// ESLint 9 flat config bridging to Next's shared config.
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'tests/e2e/**'] },
];
