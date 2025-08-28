// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { FlatCompat } from "@eslint/eslintrc";

import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  // 1) ignore
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "public/**",
    ],
  },

  // 2) base from Next
  ...compat.extends("next/core-web-vitals"),

  // 3) <<< บล็อก GLOBAL: ปิดกฎ + ชี้ rootDir >>>
  {
    // ใช้ได้ทั้งโปรเจ็กต์ (ไม่ใส่ files)
    settings: {
      next: { rootDir: ["apps/web"] },
      react: { version: "18.3" }, // กัน warning "detect"
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },

  // 4) TS + JS
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 5) กฎเฉพาะโฟลเดอร์เว็บ
  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, React: true },
    },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // ไม่ต้องปิดซ้ำแล้ว แต่จะคงไว้ก็ไม่เป็นไร
      // "@next/next/no-html-link-for-pages": "off",
    },
  },

  // 6) allow next-env.d.ts
  {
    files: ["apps/web/next-env.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },

  // 7) โฟลเดอร์ api
  {
    files: ["apps/api/**/*.{ts,js}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
