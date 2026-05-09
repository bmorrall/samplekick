import { describe, it, expect } from "vitest";
import { createSquashNameTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("SquashNameTransformer integration", () => {
  it("applies createSquashNameTransformer to convert names to camelCase", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Bass Loops/kick drum 01.wav" }),
      createFileEntry({ path: "Drum-Hits/Snare_hit.wav" }),
      createFileEntry({ path: "Other Pack/hat.wav" }),
      createFileEntry({ path: "Other Pack/Open_Hat.wav" }),
      createFileEntry({ path: "Other Pack/ride-cymbal.wav" }),
      createFileEntry({ path: "Other Pack/crash - cymbal.wav" }),
    ]);
    registry.applyTransform(createSquashNameTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── BassLoops [renamed]",
        "│   └── kickDrum01.wav [?] [renamed]",
        "├── DrumHits [renamed]",
        "│   └── SnareHit.wav [?] [renamed]",
        "└── OtherPack [renamed]",
        "    ├── hat.wav [?]",
        "    ├── OpenHat.wav [?] [renamed]",
        "    ├── rideCymbal.wav [?] [renamed]",
        "    └── crashCymbal.wav [?] [renamed]",
        "",
      ].join("\n"),
    );
  });
});
