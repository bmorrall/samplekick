import { describe, it, expect } from "vitest";
import { createFLStudioProjectTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("FLStudioProjectTransformer integration", () => {
  it("applies createFLStudioProjectTransformer to tag FL Studio project folders", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "My Beat/My Beat.flp" }),
      createFileEntry({ path: "My Beat/kick.wav" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createFLStudioProjectTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "┣━━ My Beat [type:FL Studio Projects]",
        "┃   ├── My Beat.flp [?]",
        "┃   └── kick.wav [?]",
        "└── samples [skipped]",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
