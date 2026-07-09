import { describe, it, expect } from "vitest";
import {
  createConstructionKitTransformer,
  createDirectorySampleTypeTransformer,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("ConstructionKitTransformer integration", () => {
  it("enables matched kit subtrees under a kits parent", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({
        path: "Construction Kits/Construction Kit 1 - Nightcall - Dm 95BPM/Drums/kick.wav",
      }),
      createFileEntry({
        path: "Construction Kits/Construction Kit 2 - Spaceship - Fm 115BPM/Bass/bass.wav",
      }),
      createFileEntry({ path: "Construction Kits/Bonus Loops/loop.wav" }),
    ]);

    registry.applyTransform(createDirectorySampleTypeTransformer());
    registry.applyTransform(createConstructionKitTransformer());

    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "└── Construction Kits [skipped]",
        "    ┣━━ Construction Kit 1 - Nightcall - Dm 95BPM",
        "    ┃   ┗━━ Drums",
        "    ┃       └── kick.wav [?]",
        "    ┣━━ Construction Kit 2 - Spaceship - Fm 115BPM",
        "    ┃   ┗━━ Bass",
        "    ┃       └── bass.wav [?]",
        "    └── Bonus Loops [type:Loops, skipped]",
        "        └── loop.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
