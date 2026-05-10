import { describe, it, expect } from "vitest";
import { createArchiveFileTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("ArchiveFileTransformer integration", () => {
  it("applies createArchiveFileTransformer to set sampleType on .zip files", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "extras/bonus.zip" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createArchiveFileTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── extras",
        "│   ┗━━ bonus.zip [?] [type:Archive]",
        "└── samples",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
