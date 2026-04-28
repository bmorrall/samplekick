import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/index.ts", "src/io/index.ts", "src/configuration/index.ts", "src/transformers/index.ts", "tests/support.ts"],
    },
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
        },
      },
    ],
  },
});
