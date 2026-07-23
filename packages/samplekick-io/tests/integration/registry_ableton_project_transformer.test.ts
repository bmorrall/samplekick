import { describe, it, expect } from "vitest";
import { createAbletonProjectTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";
import type { Registry } from "../../src";

const readOnlyOf = (registry: Registry, path: string): boolean | undefined =>
  registry.getEntry(path)?.isReadOnly?.();

describe("AbletonProjectTransformer integration", () => {
  it("applies createAbletonProjectTransformer to tag Ableton project folders", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "My Project/My Project.als" }),
      createFileEntry({ path: "My Project/Samples/kick.wav" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createAbletonProjectTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "┣━━ My Project [type:Ableton Projects]",
        "┃   ├── My Project.als [?]",
        "┃   ┗━━ Samples",
        "┃       └── kick.wav [?]",
        "└── samples [skipped]",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("flags every file and directory inside the project as readOnly", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "My Project/My Project.als" }),
      createFileEntry({ path: "My Project/Samples/kick.wav" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createAbletonProjectTransformer());

    expect(readOnlyOf(registry, "My Project")).toBe(true);
    expect(readOnlyOf(registry, "My Project/My Project.als")).toBe(true);
    expect(readOnlyOf(registry, "My Project/Samples")).toBe(true);
    expect(readOnlyOf(registry, "My Project/Samples/kick.wav")).toBe(true);

    // Untouched, non-Ableton entries stay writable
    expect(readOnlyOf(registry, "samples")).toBeUndefined();
    expect(readOnlyOf(registry, "samples/kick.wav")).toBeUndefined();
  });
});
