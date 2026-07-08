import { describe, it, expect } from "vitest";
import { createKeepPathsTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("KeepPathsTransformer integration", () => {
  it("sets keepStructure across the entire source tree", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Drums/Kicks/kick.wav" }),
      createFileEntry({ path: "Drums/Snares/snare.wav" }),
    ]);

    registry.applyTransform(createKeepPathsTransformer());

    expect(registry.toString()).toBe(
      [
        "Pack.zip",
        "┗━━ Drums",
        "    ┣━━ Kicks",
        "    ┃   └── kick.wav [?]",
        "    ┗━━ Snares",
        "        └── snare.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
