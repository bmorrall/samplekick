import { describe, it, expect } from "vitest";
import { createStripFormatHintsTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("StripFormatHintsTransformer integration", () => {
  it("strips bracketed and hyphen-suffix format hints from folder names", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Samples (WAV)/kick (WAV).wav" }),
      createFileEntry({ path: "Drums - 24bit/snare.wav" }),
      createFileEntry({ path: "Bass - 44.1kHz/bass.wav" }),
      createFileEntry({ path: "Loops [16bit]/loop.wav" }),
      createFileEntry({ path: "Loops [STEMS]/stem.wav" }),
    ]);
    registry.applyTransform(createStripFormatHintsTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Samples [renamed, skipped]",
        "│   └── kick.wav [?] [renamed]",
        "├── Drums [renamed, skipped]",
        "│   └── snare.wav [?]",
        "├── Bass [renamed, skipped]",
        "│   └── bass.wav [?]",
        "├── Loops [renamed, skipped]",
        "│   └── loop.wav [?]",
        "└── Loops [STEMS] [skipped]",
        "    └── stem.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
