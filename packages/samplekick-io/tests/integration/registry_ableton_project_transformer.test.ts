import { describe, it, expect } from "vitest";
import { createAbletonProjectTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("AbletonProjectTransformer integration", () => {
  it("applies createAbletonProjectTransformer to tag Ableton project folders", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "My Project/My Project.als" }),
      createFileEntry({ path: "My Project/Samples/kick.wav" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createAbletonProjectTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "┣━━ My Project [type:Ableton Projects]",
        "┃   ┣━━ My Project.als [?]",
        "┃   ┗━━ Samples",
        "┃       ┗━━ kick.wav [?]",
        "└── samples",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
