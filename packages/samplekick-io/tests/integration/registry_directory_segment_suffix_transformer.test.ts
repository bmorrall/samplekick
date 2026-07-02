import { describe, it, expect } from "vitest";
import {
  createDirectorySampleTypeTransformer,
  createDirectorySegmentSuffixTransformer,
  createDirectorySubcategoryTransformer,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("DirectorySegmentSuffixTransformer integration", () => {
  it("tags directories whose name ends with a known type after stripping a leading word", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Cymatics - Phoenix Vocal Loops/loop.wav" }),
      createFileEntry({ path: "Brand - My Drum Loops/kick.wav" }),
      createFileEntry({ path: "Label - Unknown Category/hit.wav" }),
    ]);
    registry.applyTransform(createDirectorySegmentSuffixTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "├── Cymatics - Phoenix Vocal Loops [type:Vocal Loops, skipped]",
        "│   └── loop.wav [?]",
        "├── Brand - My Drum Loops [type:Drum Loops, skipped]",
        "│   └── kick.wav [?]",
        "└── Label - Unknown Category [skipped]",
        "    └── hit.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("feeds the subcategory transformer with types resolved from segment suffixes", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({
        path: "Cymatics - Phoenix Vocal Loops/Latin/loop.wav",
      }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer());
    registry.applyTransform(createDirectorySegmentSuffixTransformer());
    registry.applyTransform(createDirectorySubcategoryTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "└── Cymatics - Phoenix Vocal Loops [type:Vocal Loops, skipped]",
        "    └── Latin [type:Vocal Loops - Latin, skipped]",
        "        └── loop.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("does not tag when multiple segments each resolve to a different known type", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({
        path: "Brand - Signature Vocals - Phoenix Drum Loops/sample.wav",
      }),
    ]);
    registry.applyTransform(createDirectorySegmentSuffixTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "└── Brand - Signature Vocals - Phoenix Drum Loops [skipped]",
        "    └── sample.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
