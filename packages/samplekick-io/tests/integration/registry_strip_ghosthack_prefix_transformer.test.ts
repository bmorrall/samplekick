import { describe, it, expect } from "vitest";
import {
  createMultiPackNameTransformer,
  createStripGhosthackPrefixTransformer,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("StripGhosthackPrefixTransformer integration", () => {
  it("strips the Ghosthack prefix from file names, but leaves untagged directories", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Ghosthack - Bass Loops/Ghosthack - Bass Loop 01.wav",
      }),
      createFileEntry({ path: "Other Pack/hat.wav" }),
    ]);
    registry.applyTransform(createStripGhosthackPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Ghosthack - Bass Loops [skipped]",
        "│   └── Bass Loop 01.wav [?] [renamed]",
        "└── Other Pack [skipped]",
        "    └── hat.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("leaves Ghosthack collab names unchanged", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Ghosthack x Boom/Ghosthack x Boom - Sci-Fi Horror FX.wav",
      }),
    ]);
    registry.applyTransform(createStripGhosthackPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Ghosthack x Boom [skipped]",
        "    └── Ghosthack x Boom - Sci-Fi Horror FX.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("strips a directory's own name when its own packageName is a Ghosthack pack", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Ghosthack - Ultimate Freebie Collection/file.wav",
      }),
    ]);
    // Tags directories containing " - " with an own packageName matching their name.
    registry.applyTransform(createMultiPackNameTransformer());
    registry.applyTransform(createStripGhosthackPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Ultimate Freebie Collection [renamed, pkg:Ghosthack - Ultimate Freebie Collection, skipped]",
        "    └── file.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("strips a nested directory's name when it inherits a Ghosthack packageName from a parent directory", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Ghosthack - Ultimate Freebie Collection/Ghosthack Extras/file.wav",
      }),
    ]);
    // Tags only the top directory ("Ghosthack Extras" has no " - " so is untagged
    // itself, but still inherits the parent's packageName via getPackageName()).
    registry.applyTransform(createMultiPackNameTransformer());
    registry.applyTransform(createStripGhosthackPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Ultimate Freebie Collection [renamed, pkg:Ghosthack - Ultimate Freebie Collection, skipped]",
        "    └── Extras [renamed, skipped]",
        "        └── file.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("does not strip a directory tagged with a non-Ghosthack packageName", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Cymatics - Mystery Pack/file.wav",
      }),
    ]);
    registry.applyTransform(createMultiPackNameTransformer());
    registry.applyTransform(createStripGhosthackPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Cymatics - Mystery Pack [pkg:Cymatics - Mystery Pack, skipped]",
        "    └── file.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
