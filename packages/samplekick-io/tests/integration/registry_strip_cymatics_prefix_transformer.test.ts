import { describe, it, expect } from "vitest";
import {
  createMultiPackNameTransformer,
  createStripCymaticsPrefixTransformer,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("StripCymaticsPrefixTransformer integration", () => {
  it("strips the Cymatics prefix from file names, but leaves untagged directories", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Cymatics - Bass Loops/Cymatics - Bass Loop 01.wav",
      }),
      createFileEntry({ path: "Other Pack/hat.wav" }),
    ]);
    registry.applyTransform(createStripCymaticsPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Cymatics - Bass Loops [skipped]",
        "│   └── Bass Loop 01.wav [?] [renamed]",
        "└── Other Pack [skipped]",
        "    └── hat.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("leaves Cymatics collab names unchanged", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Cymatics x Boom/Cymatics x Boom - Sci-Fi Horror FX.wav",
      }),
    ]);
    registry.applyTransform(createStripCymaticsPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Cymatics x Boom [skipped]",
        "    └── Cymatics x Boom - Sci-Fi Horror FX.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("strips a directory's own name when its own packageName is a Cymatics pack", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Cymatics - Ultimate Freebie Collection/file.wav",
      }),
    ]);
    // Tags directories containing " - " with an own packageName matching their name.
    registry.applyTransform(createMultiPackNameTransformer());
    registry.applyTransform(createStripCymaticsPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Ultimate Freebie Collection [renamed, pkg:Cymatics - Ultimate Freebie Collection, skipped]",
        "    └── file.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("strips a nested directory's name when it inherits a Cymatics packageName from a parent directory", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Cymatics - Ultimate Freebie Collection/Cymatics Extras/file.wav",
      }),
    ]);
    // Tags only the top directory ("Cymatics Extras" has no " - " so is untagged
    // itself, but still inherits the parent's packageName via getPackageName()).
    registry.applyTransform(createMultiPackNameTransformer());
    registry.applyTransform(createStripCymaticsPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Ultimate Freebie Collection [renamed, pkg:Cymatics - Ultimate Freebie Collection, skipped]",
        "    └── Extras [renamed, skipped]",
        "        └── file.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("does not strip a directory tagged with a non-Cymatics packageName", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Ghosthack - Mystery Pack/file.wav",
      }),
    ]);
    registry.applyTransform(createMultiPackNameTransformer());
    registry.applyTransform(createStripCymaticsPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Ghosthack - Mystery Pack [pkg:Ghosthack - Mystery Pack, skipped]",
        "    └── file.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
