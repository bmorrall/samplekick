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
        "root [skipped]",
        "├── Acapellas [type:Vocals - Acapellas, skipped]",
        "│   └── vocal.wav [?]",
        "├── Acapella [type:Vocals - Acapellas, skipped]",
        "│   └── chant.wav [?]",
        "├── Acapellas and Vocals [type:Vocals - Acapellas, skipped]",
        "│   └── dry.wav [?]",
        "├── Acapellas & Vocals [type:Vocals - Acapellas, skipped]",
        "│   └── wet.wav [?]",
        "└── Vocals [skipped]",
        "    └── main.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
