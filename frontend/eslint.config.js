import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'src/runtime/nethack.js'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
  },
];
