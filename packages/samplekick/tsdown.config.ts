import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/pipeline.ts"],
  dts: {
    tsgo: true,
  },
});
