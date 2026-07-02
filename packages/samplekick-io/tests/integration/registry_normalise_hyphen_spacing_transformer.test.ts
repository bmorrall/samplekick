import { describe, it, expect } from "vitest";
import { createNormaliseHyphenSpacingTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("NormaliseHyphenSpacingTransformer integration", () => {
  it("applies createNormaliseHyphenSpacingTransformer to fix hyphens touching adjacent words", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums- Bass/kick.wav" }),
      createFileEntry({ path: "Kicks -Snares/snare.wav" }),
      createFileEntry({ path: "Hi-Hats/hat.wav" }),
      createFileEntry({ path: "Drums-_Bass/kick.wav" }),
      createFileEntry({ path: "Kicks_-Snares/snare.wav" }),
    ]);
    registry.applyTransform(createNormaliseHyphenSpacingTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Drums - Bass [renamed, skipped]",
        "│   └── kick.wav [?]",
        "├── Kicks - Snares [renamed, skipped]",
        "│   └── snare.wav [?]",
        "├── Hi-Hats [skipped]",
        "│   └── hat.wav [?]",
        "├── Drums_-_Bass [renamed, skipped]",
        "│   └── kick.wav [?]",
        "└── Kicks_-_Snares [renamed, skipped]",
        "    └── snare.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
