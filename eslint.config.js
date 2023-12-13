const globals = require("globals");
const eslintPluginNode = require("eslint-plugin-n");
const eslintPluginEslintPluginRecommended = require("eslint-plugin-eslint-plugin/configs/recommended");
const importPlugin = require("eslint-plugin-import");
const {configs: eslintConfigs} = require("@eslint/js");
const stylistic = require("@stylistic/eslint-plugin");
const eslintConfigPrettier = require("eslint-config-prettier");
const eslintPluginPrettier = require("eslint-plugin-prettier");

module.exports = [
  eslintConfigPrettier,
  eslintConfigs.all,
  eslintPluginNode.configs["flat/recommended"],
  eslintPluginEslintPluginRecommended,
  stylistic.configs["all-flat"],
  {
    plugins: {prettier: eslintPluginPrettier},
    rules: eslintPluginPrettier.configs.recommended.rules
  },
  {
    files: ["**/*.cjs", "**/*.js", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      import: importPlugin
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      "consistent-this": "off",
      "line-comment-position": "off",
      "max-lines-per-function": ["error", 100],
      "max-statements": ["error", 25],
      "no-await-in-loop": "off",
      "n/no-missing-require": "off",
      "n/no-unpublished-require": "off",
      "no-inline-comments": "off",
      "no-magic-numbers": "off",
      "no-undef": "warn",
      "one-var": "off",
      "sort-keys": "off",
      strict: "off",
      "@stylistic/array-element-newline": ["error", "consistent"],
      "@stylistic/dot-location": ["error", "property"],
      "@stylistic/function-call-argument-newline": ["error", "consistent"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/object-property-newline": "off",
      "@stylistic/quote-props": ["error", "as-needed"],
      "@stylistic/padded-blocks": ["error", "never"]
    }
  }
];
