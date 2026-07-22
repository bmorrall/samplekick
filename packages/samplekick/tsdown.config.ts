import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/pipeline.ts",
    "src/post_processors/index.ts",
    "src/adaptors/index.ts",
  ],
  dts: {
    tsgo: true,
  },
});
