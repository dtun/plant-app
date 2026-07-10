// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const jestPlugin = require("eslint-plugin-jest");
const prettierConfig = require("eslint-config-prettier");

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // let-by-default, function declarations — see docs/adr/0002
    rules: {
      "func-style": ["error", "declaration"],
      "prefer-const": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/jest.setup.js"],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: jestPlugin.environments.globals.globals,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
    },
  },
]);
