import { describe, it, expect } from "vitest";
import { createNormaliseBpmTagTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("NormaliseBpmTagTransformer integration", () => {
  it("applies createNormaliseBpmTagTransformer to normalise BPM tags in folder names", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums 120BPM/kick.wav" }),
      createFileEntry({ path: "Bass - BPM 90/bass.wav" }),
      createFileEntry({ path: "Keys/piano.wav" }),
    ]);
    registry.applyTransform(createNormaliseBpmTagTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Drums 120bpm [renamed]",
        "│   └── kick.wav [?]",
        "├── Bass - 90bpm [renamed]",
        "│   └── bass.wav [?]",
        "└── Keys",
        "    └── piano.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
