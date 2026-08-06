import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";

const eslintConfig = defineConfig([
  globalIgnores([
    "dist/**",
    "coverage/**",
    "supabase/.temp/**",
    "src/types/database.ts",
  ]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      globals: { window: "readonly" },
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      "vue/html-self-closing": "off",
      "vue/max-attributes-per-line": "off",
      "vue/multi-word-component-names": "off",
      "vue/singleline-html-element-content-newline": "off",
    },
  },
]);

export default eslintConfig;
