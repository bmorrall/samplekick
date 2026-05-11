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
        "root",
        "├── Samples [renamed]",
        "│   └── kick.wav [?] [renamed]",
        "├── Drums [renamed]",
        "│   └── snare.wav [?]",
        "├── Bass [renamed]",
        "│   └── bass.wav [?]",
        "├── Loops [renamed]",
        "│   └── loop.wav [?]",
        "└── Loops [STEMS]",
        "    └── stem.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
