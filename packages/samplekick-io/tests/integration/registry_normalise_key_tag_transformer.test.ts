import { describe, it, expect } from "vitest";
import { createNormaliseKeyTagTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("NormaliseKeyTagTransformer integration", () => {
  it("applies createNormaliseKeyTagTransformer to normalise key tags in folder names", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Loops C Major/piano.wav" }),
      createFileEntry({ path: "Bass F# Minor/bass.wav" }),
      createFileEntry({ path: "Drums/kick.wav" }),
    ]);
    registry.applyTransform(createNormaliseKeyTagTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Loops Cmaj [renamed]",
        "│   └── piano.wav [?]",
        "├── Bass F#min [renamed]",
        "│   └── bass.wav [?]",
        "└── Drums",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
