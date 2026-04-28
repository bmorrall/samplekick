import love from "eslint-config-love";

export default [
  {
    ignores: ["coverage/**", "packages/*/dist/**", "packages/*/coverage/**"],
  },
  {
    ...love,
    files: ["packages/*/src/**/*.ts", "packages/*/tests/**/*.ts"],
    rules: {
      ...love.rules,
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "@typescript-eslint/no-magic-numbers": ["error", { ignore: [0, 1] }],
      "@typescript-eslint/class-methods-use-this": [
        "error",
        { ignoreClassesThatImplementAnInterface: true },
      ],
    },
  },
  {
    files: ["packages/*/tests/**/*.ts", "packages/*/tests/integration/**/*.ts"],
    rules: {
      "@typescript-eslint/no-magic-numbers": "off",
    },
  },
  {
    files: ["packages/samplekick/src/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
