// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended, // กฎมาตรฐานของ ESLint
  ...tseslint.configs.recommended, // กฎสำหรับ TypeScript
  {
    ignores: ['node_modules', 'dist', '.next', 'coverage'], // ไม่เช็กไฟล์เหล่านี้
  },
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
