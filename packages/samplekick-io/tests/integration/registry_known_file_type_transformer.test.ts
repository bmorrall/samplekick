import { describe, it, expect } from "vitest";
import { createKnownFileTypeTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("KnownFileTypeTransformer integration", () => {
  it("applies createKnownFileTypeTransformer to set sampleType on .fxp files", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "presets/bass.fxp" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createKnownFileTypeTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── presets",
        "│   ┗━━ bass.fxp [?] [type:Serum Presets]",
        "└── samples",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
