import { describe, it, expect } from "vitest";
import { createAcapellaTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("AcapellaTransformer integration", () => {
  it("tags acapella directories with the correct sampleType", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Acapellas/vocal.wav" }),
      createFileEntry({ path: "Acapella/chant.wav" }),
      createFileEntry({ path: "Acapellas and Vocals/dry.wav" }),
      createFileEntry({ path: "Acapellas & Vocals/wet.wav" }),
      createFileEntry({ path: "Vocals/main.wav" }),
    ]);
    registry.applyTransform(createAcapellaTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Acapellas [type:Vocals - Acapellas]",
        "│   └── vocal.wav [?]",
        "├── Acapella [type:Vocals - Acapellas]",
        "│   └── chant.wav [?]",
        "├── Acapellas and Vocals [type:Vocals - Acapellas]",
        "│   └── dry.wav [?]",
        "├── Acapellas & Vocals [type:Vocals - Acapellas]",
        "│   └── wet.wav [?]",
        "└── Vocals",
        "    └── main.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
