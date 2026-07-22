import { describe, it, expect } from "vitest";
import { createFlatPackPrefixTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("FlatPackPrefixTransformer integration", () => {
  it("applies createFlatPackPrefixTransformer to detect shared prefixes in flat-pack zips", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Sounds by Sunwarper - SP404 Pack - 01 D4.wav" }),
      createFileEntry({ path: "Sounds by Sunwarper - SP404 Pack - 02 E4.wav" }),
      createFileEntry({ path: "album.jpg" }),
    ]);
    registry.applyTransform(createFlatPackPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [pkg:Sounds by Sunwarper - SP404 Pack, type:Packs, skipped]",
        "├── 01 D4.wav [renamed]",
        "├── 02 E4.wav [renamed]",
        "└── album.jpg",
        "",
      ].join("\n"),
    );
  });

  it("does not apply createFlatPackPrefixTransformer when root has sub-directories", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Samples/Pack - 01 kick.wav" }),
      createFileEntry({ path: "Samples/Pack - 02 snare.wav" }),
    ]);
    registry.applyTransform(createFlatPackPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Samples [skipped]",
        "    ├── Pack - 01 kick.wav [?]",
        "    └── Pack - 02 snare.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
