import { describe, it, expect } from "vitest";
import { createDirectoryChildNameTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("DirectoryChildNameTransformer integration", () => {
  it("tags a directory whose file children share a common known-type segment", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({
        path: "Cymatics - Nebula/Cymatics - Foley - Coin Drop 1.wav",
      }),
      createFileEntry({
        path: "Cymatics - Nebula/Cymatics - Foley - Metal Hit.wav",
      }),
      createFileEntry({ path: "Unknown Brand/Unknown Category - Hit.wav" }),
    ]);
    registry.applyTransform(createDirectoryChildNameTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip",
        "├── Cymatics - Nebula [type:Foley]",
        "│   ├── Cymatics - Foley - Coin Drop 1.wav [?]",
        "│   └── Cymatics - Foley - Metal Hit.wav [?]",
        "└── Unknown Brand",
        "    └── Unknown Category - Hit.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("does not tag when no common segment resolves to a known type", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "My Pack/Brand - Foley - Hit.wav" }),
      createFileEntry({ path: "My Pack/Brand - Drums - Kick.wav" }),
    ]);
    registry.applyTransform(createDirectoryChildNameTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip",
        "└── My Pack",
        "    ├── Brand - Foley - Hit.wav [?]",
        "    └── Brand - Drums - Kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("does not overwrite a sampleType already set by a prior transformer", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Foley/Brand - Drums - Kick.wav" }),
    ]);
    registry.applyTransform(createDirectoryChildNameTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip",
        "└── Foley",
        "    └── Brand - Drums - Kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
