import { describe, it, expect } from "vitest";
import {
  createDrumSubcategoryTransformer,
  createDirectorySampleTypeTransformer,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("DrumSubcategoryTransformer integration", () => {
  it("applies createDrumSubcategoryTransformer to tag drum subcategory directories", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums/Fills/fill.wav" }),
      createFileEntry({ path: "Drums/Breaks/break.wav" }),
      createFileEntry({ path: "Drum Fills/fill.wav" }),
      createFileEntry({ path: "Drum - Breaks/break.wav" }),
      createFileEntry({ path: "Percussion/Fills/shaker.wav" }),
    ]);
    registry.applyTransform(createDrumSubcategoryTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Drums [skipped]",
        "│   ├── Fills [type:Drum Fills, skipped]",
        "│   │   └── fill.wav [?]",
        "│   └── Breaks [type:Drum Breaks, skipped]",
        "│       └── break.wav [?]",
        "├── Drum Fills [type:Drum Fills, skipped]",
        "│   └── fill.wav [?]",
        "├── Drum - Breaks [type:Drum Breaks, skipped]",
        "│   └── break.wav [?]",
        "└── Percussion [skipped]",
        "    └── Fills [skipped]",
        "        └── shaker.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("does not let createDirectorySampleTypeTransformer overwrite drum subcategory sampleTypes when run after", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drum - Fills/fill.wav" }),
      createFileEntry({ path: "Drums - Breaks/break.wav" }),
    ]);
    registry.applyTransform(createDrumSubcategoryTransformer());
    registry.applyTransform(createDirectorySampleTypeTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Drum - Fills [type:Drum Fills, skipped]",
        "│   └── fill.wav [?]",
        "└── Drums - Breaks [type:Drum Breaks, skipped]",
        "    └── break.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("correctly tags Drums and a Fills subdirectory when both transformers run in pipeline order", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums/Fills/fill.wav" }),
    ]);
    registry.applyTransform(createDrumSubcategoryTransformer());
    registry.applyTransform(createDirectorySampleTypeTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Drums [type:Drums, skipped]",
        "    └── Fills [type:Drum Fills, skipped]",
        "        └── fill.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
