import { describe, it, expect } from "vitest";
import { createCymaticsNameTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("CymaticsNameTransformer integration", () => {
  it("applies createCymaticsNameTransformer to normalise Cymatics prefixes", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Cymatics-Bass Loops/Cymatics-Bass Loop 01.wav",
      }),
      createFileEntry({
        path: "Cymatics -Drum Hits/Cymatics -Snare Hit.wav",
      }),
      createFileEntry({ path: "Cymatics_Synths/Cymatics_Pad 01.wav" }),
      createFileEntry({ path: "Cymatics - Pads/Cymatics - Pad 01.wav" }),
      createFileEntry({ path: "Other Pack/hat.wav" }),
    ]);
    registry.applyTransform(createCymaticsNameTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Cymatics - Bass Loops [renamed]",
        "│   └── Cymatics - Bass Loop 01.wav [?] [renamed]",
        "├── Cymatics - Drum Hits [renamed]",
        "│   └── Cymatics - Snare Hit.wav [?] [renamed]",
        "├── Cymatics - Synths [renamed]",
        "│   └── Cymatics - Pad 01.wav [?] [renamed]",
        "├── Cymatics - Pads",
        "│   └── Cymatics - Pad 01.wav [?]",
        "└── Other Pack",
        "    └── hat.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
