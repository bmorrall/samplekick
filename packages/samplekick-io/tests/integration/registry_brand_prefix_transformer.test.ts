import { describe, it, expect } from "vitest";
import {
  createBrandPrefixTransformer,
  createMultiPackNameTransformer,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("BrandPrefixTransformer integration", () => {
  it("prefixes child packageName with parent's Ghosthack brand", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Ghosthack - Ultimate Freebie Collection/Construction Kits/Ghosthack - Day 12 Kits/file.wav",
      }),
    ]);
    registry.applyTransform(createMultiPackNameTransformer());
    registry.applyTransform(createBrandPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "└── Ghosthack - Ultimate Freebie Collection [pkg:Ghosthack - Ultimate Freebie Collection]",
        "    └── Construction Kits",
        "        └── Ghosthack - Day 12 Kits [pkg:Ghosthack - Day 12 Kits]",
        "            └── file.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("prefixes child packageName with parent's Cymatics brand", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Cymatics - Mystery Pack Vol 4/Cymatics - Bundle 01 Kit/file.wav",
      }),
    ]);
    registry.applyTransform(createMultiPackNameTransformer());
    registry.applyTransform(createBrandPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "└── Cymatics - Mystery Pack Vol 4 [pkg:Cymatics - Mystery Pack Vol 4]",
        "    └── Cymatics - Bundle 01 Kit [pkg:Cymatics - Bundle 01 Kit]",
        "        └── file.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("does not prefix when parent has no brand prefix", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Acapellas and Vocals/Collection/file.wav",
      }),
    ]);
    registry.applyTransform(createMultiPackNameTransformer());
    registry.applyTransform(createBrandPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "└── Acapellas and Vocals",
        "    └── Collection",
        "        └── file.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
