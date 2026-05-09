import { describe, it, expect } from "vitest";
import { createKnownFileTypeTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("KnownFileTypeTransformer integration", () => {
  it("applies createKnownFileTypeTransformer to set sampleType on .mid and .fxp files", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "beats/groove.mid" }),
      createFileEntry({ path: "presets/bass.fxp" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createKnownFileTypeTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── beats",
        "│   ┗━━ groove.mid [?] [type:MIDI]",
        "├── presets",
        "│   ┗━━ bass.fxp [?] [type:Serum Presets]",
        "└── samples",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
