import { describe, it, expect } from "vitest";
import { createNormaliseDashesTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("NormaliseDashesTransformer integration", () => {
  it("applies createNormaliseDashesTransformer to replace en/em dashes with hyphen-minus", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums – Bass/kick.wav" }),
      createFileEntry({ path: "Hi—Hats/hat.wav" }),
      createFileEntry({ path: "Normal-Folder/snare.wav" }),
    ]);
    registry.applyTransform(createNormaliseDashesTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Drums - Bass [renamed]",
        "│   └── kick.wav [?]",
        "├── Hi-Hats [renamed]",
        "│   └── hat.wav [?]",
        "└── Normal-Folder",
        "    └── snare.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
