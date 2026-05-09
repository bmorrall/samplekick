import { describe, it, expect } from "vitest";
import { createGhosthackNameTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("GhosthackNameTransformer integration", () => {
  it("applies createGhosthackNameTransformer to normalise Ghosthack prefixes", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Ghosthack-Bass Loops/Ghosthack-Bass Loop 01.wav" }),
      createFileEntry({ path: "Ghosthack -Drum Hits/Ghosthack -Snare Hit.wav" }),
      createFileEntry({ path: "Ghosthack_Synths/Ghosthack_Pad 01.wav" }),
      createFileEntry({ path: "Ghosthack - Pads/Ghosthack - Pad 01.wav" }),
      createFileEntry({ path: "Other Pack/hat.wav" }),
    ]);
    registry.applyTransform(createGhosthackNameTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Ghosthack - Bass Loops [renamed]",
        "│   └── Ghosthack - Bass Loop 01.wav [?] [renamed]",
        "├── Ghosthack - Drum Hits [renamed]",
        "│   └── Ghosthack - Snare Hit.wav [?] [renamed]",
        "├── Ghosthack - Synths [renamed]",
        "│   └── Ghosthack - Pad 01.wav [?] [renamed]",
        "├── Ghosthack - Pads",
        "│   └── Ghosthack - Pad 01.wav [?]",
        "└── Other Pack",
        "    └── hat.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
