import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      exclude: ["src/index.ts"],
    },
  },
});
